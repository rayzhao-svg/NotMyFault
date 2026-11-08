import { GoogleGenAI } from '@google/genai';
import { getGeminiModel } from './geminiConfig';
import { GEMINI_TIMEOUT_MS } from './geminiDeadline';
import {
  AnalysisResult,
  LandlordDeduction,
  VisualFinding,
  CaseMetadata,
  BoundingBox,
  DamageClassification,
} from '../types/deposit';
import { computeFinancialTotals } from './calculator';

export interface AnalyzeRequestPayload {
  moveInBase64: string;
  moveInMimeType: string;
  moveOutBase64: string;
  moveOutMimeType: string;
  deductions: LandlordDeduction[];
  metadata?: Partial<CaseMetadata>;
}

export interface RawModelFinding {
  id?: string;
  damageDescription?: string;
  location?: string;
  moveInObservation?: string;
  moveOutObservation?: string;
  classification?: string;
  confidence?: string;
  evidenceExplanation?: string;
  associatedChargeIds?: string[];
  moveInBox?: { ymin?: number; xmin?: number; ymax?: number; xmax?: number } | number[] | null;
  moveOutBox?: { ymin?: number; xmin?: number; ymax?: number; xmax?: number } | number[] | null;
}

export interface RawModelResponse {
  comparable?: boolean;
  roomComparisonNotes?: string;
  findings?: RawModelFinding[];
}

function normalizeBoundingBox(
  rawBox: { ymin?: number; xmin?: number; ymax?: number; xmax?: number } | number[] | null | undefined
): BoundingBox | null {
  if (!rawBox) return null;

  let ymin = 0,
    xmin = 0,
    ymax = 0,
    xmax = 0;

  if (Array.isArray(rawBox)) {
    if (rawBox.length >= 4) {
      [ymin, xmin, ymax, xmax] = rawBox;
    }
  } else if (rawBox && typeof rawBox === 'object') {
    ymin = rawBox.ymin ?? 0;
    xmin = rawBox.xmin ?? 0;
    ymax = rawBox.ymax ?? 0;
    xmax = rawBox.xmax ?? 0;
  } else {
    return null;
  }

  // Handle coordinates if normalized 0.0-1.0 instead of 0-1000
  if (ymin <= 1 && xmin <= 1 && ymax <= 1 && xmax <= 1 && (ymax > 0 || xmax > 0)) {
    ymin = Math.round(ymin * 1000);
    xmin = Math.round(xmin * 1000);
    ymax = Math.round(ymax * 1000);
    xmax = Math.round(xmax * 1000);
  }

  // Clamp 0 to 1000
  ymin = Math.max(0, Math.min(1000, Math.round(ymin)));
  xmin = Math.max(0, Math.min(1000, Math.round(xmin)));
  ymax = Math.max(0, Math.min(1000, Math.round(ymax)));
  xmax = Math.max(0, Math.min(1000, Math.round(xmax)));

  // Ensure validity
  if (ymax <= ymin || xmax <= xmin) {
    return null;
  }

  return { ymin, xmin, ymax, xmax };
}

function normalizeClassification(val?: string): DamageClassification {
  const lower = (val || '').toLowerCase().trim();
  if (lower.includes('preexisting') || lower.includes('pre-existing') || lower.includes('prior')) {
    return 'preexisting';
  }
  if (lower.includes('worsen')) {
    return 'worsened';
  }
  if (lower.includes('new') || lower.includes('tenant')) {
    return 'new';
  }
  return 'uncertain';
}

export async function analyzeEvidenceWithGemini(
  payload: AnalyzeRequestPayload,
  abortSignal?: AbortSignal
): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }

  const modelName = getGeminiModel();
  const ai = new GoogleGenAI({ apiKey });

  const deductionsPromptList = payload.deductions
    .map(
      (d) =>
        `- Charge ID: "${d.id}" | Amount: $${d.amount} | Description: "${d.description}"`
    )
    .join('\n');

  const systemInstruction = `You are an expert, impartial visual evidence auditor specializing in residential rental move-in vs. move-out photographic inspections and security deposit deduction disputes.
Your task is to conduct a rigorous forensic comparison between two images:
Image 1: MOVE-IN inspection photo (baseline tenancy condition).
Image 2: MOVE-OUT inspection photo (end of tenancy condition).

RULES:
1. Objectivity: Ground every statement exclusively on visible pixels. NEVER speculate, invent dates, or fabricate evidence.
2. Room Verification: First, confirm whether both images depict the same room or architectural area by identifying matching spatial landmarks (outlets, baseboards, window frames, door frames, wall corners). If they are completely different rooms, set "comparable": false.
3. Damage Classification:
   - "preexisting": The visual blemish, scuff, nail hole, or wear was ALREADY VISIBLE in the Move-In photo, and is identical or virtually identical at Move-Out (ordinary wear & tear).
   - "new": The condition was clearly NOT present in Move-In, but is clearly visible at Move-Out.
   - "worsened": The condition existed at Move-In, but expanded significantly or has structural degradation at Move-Out.
   - "uncertain": The area cannot be conclusively evaluated due to camera angle, glare, shadows, lower resolution, or obstruction.
4. Bounding Boxes: Provide normalized bounding boxes [ymin, xmin, ymax, xmax] on a 0 to 1000 scale for each finding in moveInBox and moveOutBox when the damage is visible.
5. Deduction Linkage: Link each finding to the relevant landlord charge ID(s) provided.

Return STRICT JSON adhering to this JSON schema:
{
  "comparable": boolean,
  "roomComparisonNotes": "string explaining shared architectural anchors or why photos cannot be matched",
  "findings": [
    {
      "id": "finding-1",
      "damageDescription": "concise description of specific blemish or condition",
      "location": "location relative to room landmarks (e.g. baseboard, outlet, floor)",
      "moveInObservation": "precise observation of what appears in Move-In photo",
      "moveOutObservation": "precise observation of what appears in Move-Out photo",
      "classification": "preexisting" | "new" | "worsened" | "uncertain",
      "confidence": "high" | "medium" | "low",
      "evidenceExplanation": "clear, factual rationale distinguishing preexisting condition vs tenant liability",
      "associatedChargeIds": ["charge-id-here"],
      "moveInBox": { "ymin": 0, "xmin": 0, "ymax": 1000, "xmax": 1000 } or null,
      "moveOutBox": { "ymin": 0, "xmin": 0, "ymax": 1000, "xmax": 1000 } or null
    }
  ]
}`;

  const promptText = `Please analyze the attached Move-In photo (Image 1) and Move-Out photo (Image 2) against the following landlord deductions:
${deductionsPromptList || 'No specific charges provided; identify all visible damage and determine whether it is preexisting or new.'}

Evaluate the evidence thoroughly and output valid JSON.`;

  // Clean base64 strings if data URL headers were included
  const cleanMoveIn = payload.moveInBase64.replace(/^data:image\/[a-z]+;base64,/, '');
  const cleanMoveOut = payload.moveOutBase64.replace(/^data:image\/[a-z]+;base64,/, '');

  let responseText = '';
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: payload.moveInMimeType || 'image/jpeg',
                data: cleanMoveIn,
              },
            },
            {
              inlineData: {
                mimeType: payload.moveOutMimeType || 'image/jpeg',
                data: cleanMoveOut,
              },
            },
            {
              text: `${systemInstruction}\n\n${promptText}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        abortSignal,
        httpOptions: {
          timeout: GEMINI_TIMEOUT_MS,
          retryOptions: { attempts: 1 },
        },
      },
    });

    responseText = response.text || '';
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`GEMINI_API_ERROR: ${message}`);
  }

  // Parse and validate model JSON
  let parsed: RawModelResponse;
  try {
    const cleanedJson = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    parsed = JSON.parse(cleanedJson);
  } catch {
    throw new Error('INVALID_MODEL_OUTPUT: Gemini response could not be parsed as structured JSON.');
  }

  const rawFindings: RawModelFinding[] = Array.isArray(parsed.findings) ? parsed.findings : [];

  const validatedFindings: VisualFinding[] = rawFindings.map((rf, idx) => {
    return {
      id: rf.id?.trim() || `finding-${idx + 1}`,
      damageDescription: rf.damageDescription?.trim() || `Observed condition #${idx + 1}`,
      location: rf.location?.trim() || 'Room interior',
      moveInObservation: rf.moveInObservation?.trim() || 'Inspected in move-in photograph.',
      moveOutObservation: rf.moveOutObservation?.trim() || 'Inspected in move-out photograph.',
      classification: normalizeClassification(rf.classification),
      confidence:
        rf.confidence === 'high' || rf.confidence === 'low' ? rf.confidence : 'medium',
      evidenceExplanation:
        rf.evidenceExplanation?.trim() ||
        'Visual evaluation based on side-by-side photographic comparison.',
      associatedChargeIds: Array.isArray(rf.associatedChargeIds)
        ? rf.associatedChargeIds.filter((cid) => typeof cid === 'string')
        : [],
      moveInBox: normalizeBoundingBox(rf.moveInBox),
      moveOutBox: normalizeBoundingBox(rf.moveOutBox),
    };
  });

  // Calculate financial totals deterministically in TypeScript
  const financialTotals = computeFinancialTotals(payload.deductions, validatedFindings);

  const metadata: CaseMetadata = {
    moveInDate: payload.metadata?.moveInDate,
    moveOutDate: payload.metadata?.moveOutDate,
    roomName: payload.metadata?.roomName || 'Inspected Room',
    tenantName: payload.metadata?.tenantName || 'Tenant',
    landlordName: payload.metadata?.landlordName || 'Property Management',
    propertyAddress: payload.metadata?.propertyAddress || 'Rental Property',
    analyzedAt: new Date().toISOString(),
    isSyntheticDemo: false,
  };

  return {
    comparable: parsed.comparable !== false,
    roomComparisonNotes:
      parsed.roomComparisonNotes?.trim() ||
      'Photographic comparison completed across move-in and move-out records.',
    findings: validatedFindings,
    deductions: payload.deductions,
    financialTotals,
    metadata,
  };
}
