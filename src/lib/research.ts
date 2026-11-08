import { GoogleGenAI } from '@google/genai';
import { getGeminiModel, getGeminiThinkingConfig } from './geminiConfig';
import { GEMINI_TIMEOUT_MS } from './geminiDeadline';
import {
  LandlordDeduction,
  ResearchSource,
  MarketPriceQuote,
  PolicyComparisonItem,
} from '../types/deposit';

export interface ResearchRequestPayload {
  managementCompany: string;
  city: string;
  state: string;
  deductions: LandlordDeduction[];
  leaseExcerpt?: string;
}

export interface ResearchResult {
  managementCompany: string;
  location: string;
  sources: ResearchSource[];
  marketQuotes: MarketPriceQuote[];
  policyComparisons: PolicyComparisonItem[];
  statutorySummary: string;
}

export async function researchPolicyAndPricing(
  payload: ResearchRequestPayload,
  abortSignal?: AbortSignal
): Promise<ResearchResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = getGeminiModel();

  const chargesList = payload.deductions
    .map((d) => `Charge ID: "${d.id}" | Description: "${d.description}" | Landlord Billed: $${d.amount}`)
    .join('\n');

  const systemInstruction = `You are an expert consumer finance investigator for NotMyFault, researching residential rental deposit disputes.
You research:
1. The specific property management company's published move-out damage/cleaning policies and fee schedules.
2. The applicable state's residential tenant security deposit statutes (e.g. statutory return deadline, prohibition on deducting for ordinary wear and tear, itemization rules).
3. Publicly available market pricing for comparable repair and cleaning services in the specific city/state (${payload.city}, ${payload.state}).

CRITICAL INTEGRITY RULES:
1. NEVER fabricate or hallucinate company policies, fees, repair prices, or URLs.
2. If the company ("${payload.managementCompany}") has no published fee schedule or policy online, explicitly state: "No publicly published fee schedule located for ${payload.managementCompany}."
3. Distinguish BINDING sources (the tenant's lease and state statutes) from NON-BINDING COMPARISONS (other companies' policies or general market rates).
4. Provide realistic, verifiable URLs (e.g. state legislative codes, official municipal tenant portals, or real home service market cost indexes like HomeAdvisor, Thumbtack, or Angie's List).
5. For repair costs, identify typical market rate ranges for the specified city (${payload.city}, ${payload.state}).

Return STRICT JSON formatted as:
{
  "statutorySummary": "concise overview of applicable ${payload.state} security deposit law",
  "sources": [
    {
      "id": "source-1",
      "companyName": "source or company name",
      "sourceUrl": "https://...",
      "sourceTitle": "Title of article or statute",
      "researchCategory": "company_policy" | "statutory_law" | "market_rate" | "contractual_lease",
      "statement": "exact factual policy or legal rule",
      "publishedDate": "YYYY or N/A",
      "accessedDate": "${new Date().toISOString().split('T')[0]}",
      "relationToCharge": "how this applies to the landlord's deduction",
      "limitations": "limitations or uncertainty",
      "applicableChargeId": "charge id",
      "isBindingLeaseOrLaw": boolean
    }
  ],
  "marketQuotes": [
    {
      "id": "quote-1",
      "providerName": "provider or market aggregate index",
      "category": "Painting" | "Carpet Cleaning" | "General Cleaning" | "Repairs",
      "serviceDescription": "specific scope of work",
      "priceRangeLow": number,
      "priceRangeHigh": number,
      "averagePrice": number,
      "pricingMethod": "per room / flat rate / hourly",
      "sourceUrl": "https://...",
      "location": "${payload.city}, ${payload.state}",
      "notes": "notes on scope",
      "dateAccessed": "${new Date().toISOString().split('T')[0]}"
    }
  ],
  "policyComparisons": [
    {
      "chargeId": "charge id",
      "description": "charge description",
      "landlordAmount": number,
      "companyPolicyStatement": "company policy or 'No published policy found'",
      "companyPolicySource": { "title": "...", "url": "..." },
      "marketRateLow": number,
      "marketRateHigh": number,
      "marketRateSource": { "name": "...", "url": "..." },
      "photographicEvidence": "photographic evidence summary",
      "aiAssessment": "factual assessment comparing landlord price to market and policy",
      "disputablePotential": "high" | "moderate" | "unsupported"
    }
  ]
}`;

  const prompt = `Research policies and local repair pricing for:
Property Management Company: ${payload.managementCompany || 'Private Landlord'}
Location: ${payload.city || 'Austin'}, ${payload.state || 'TX'}

Itemized Landlord Deductions:
${chargesList}

${payload.leaseExcerpt ? `Tenant Lease Excerpt:\n${payload.leaseExcerpt}\n` : ''}

Output strictly valid JSON according to schema.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemInstruction}\n\n${prompt}` }],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: getGeminiThinkingConfig(modelName),
        abortSignal,
        httpOptions: {
          timeout: GEMINI_TIMEOUT_MS,
          retryOptions: { attempts: 3 },
        },
      },
    });

    const text = response.text || '{}';
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    return {
      managementCompany: payload.managementCompany || 'Property Management',
      location: `${payload.city || 'Local Area'}, ${payload.state || ''}`.trim(),
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      marketQuotes: Array.isArray(parsed.marketQuotes) ? parsed.marketQuotes : [],
      policyComparisons: Array.isArray(parsed.policyComparisons) ? parsed.policyComparisons : [],
      statutorySummary: parsed.statutorySummary || `${payload.state || 'State'} law requires itemized receipts and prohibits deductions for ordinary wear and tear.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`RESEARCH_API_ERROR: ${msg}`);
  }
}
