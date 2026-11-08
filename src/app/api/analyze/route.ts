import { NextRequest, NextResponse } from 'next/server';
import { analyzeEvidenceWithGemini, AnalyzeRequestPayload } from '../../../lib/gemini';
import { GeminiTimeoutError, withGeminiDeadline } from '../../../lib/geminiDeadline';

export const dynamic = 'force-dynamic';
export const maxDuration = 180;

export async function POST(req: NextRequest) {
  try {
    // Check for API key presence
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '' || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return NextResponse.json(
        {
          error: 'MISSING_API_KEY',
          message:
            'GEMINI_API_KEY is not configured in .env.local. To analyze live uploaded photos, please copy .env.example to .env.local and add your key from Google AI Studio. In the meantime, you can explore the full functional workflow using the "Try Sample Case" button.',
        },
        { status: 400 }
      );
    }

    const body = (await req.json()) as Partial<AnalyzeRequestPayload>;

    // Validate images
    if (!body.moveInBase64 || !body.moveOutBase64) {
      return NextResponse.json(
        {
          error: 'MISSING_IMAGES',
          message: 'Both Move-In and Move-Out photos are required for comparative analysis.',
        },
        { status: 400 }
      );
    }

    // Validate size (max ~12MB base64 per image)
    const MAX_BASE64_LENGTH = 16 * 1024 * 1024;
    if (
      body.moveInBase64.length > MAX_BASE64_LENGTH ||
      body.moveOutBase64.length > MAX_BASE64_LENGTH
    ) {
      return NextResponse.json(
        {
          error: 'IMAGE_TOO_LARGE',
          message: 'One or both images exceed the maximum allowed size (12MB). Please select smaller or compressed photos.',
        },
        { status: 400 }
      );
    }

    // Validate deductions
    const deductions = Array.isArray(body.deductions) ? body.deductions : [];
    if (deductions.length === 0) {
      return NextResponse.json(
        {
          error: 'MISSING_DEDUCTIONS',
          message: 'Please provide at least one itemized landlord deduction to dispute.',
        },
        { status: 400 }
      );
    }

    const payload: AnalyzeRequestPayload = {
      moveInBase64: body.moveInBase64,
      moveInMimeType: body.moveInMimeType || 'image/jpeg',
      moveOutBase64: body.moveOutBase64,
      moveOutMimeType: body.moveOutMimeType || 'image/jpeg',
      deductions,
      metadata: body.metadata || {},
    };

    const analysisResult = await withGeminiDeadline((signal) => analyzeEvidenceWithGemini(payload, signal));

    return NextResponse.json(analysisResult, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof GeminiTimeoutError) {
      return NextResponse.json(
        {
          error: 'ANALYSIS_TIMEOUT',
          message: 'Photo analysis took too long. Please try again, or use "Try Sample Case".',
        },
        { status: 504 }
      );
    }

    const errorMsg = err instanceof Error ? err.message : String(err);

    if (errorMsg.includes('MISSING_API_KEY')) {
      return NextResponse.json(
        {
          error: 'MISSING_API_KEY',
          message:
            'GEMINI_API_KEY is not configured in .env.local. Please add your key to analyze live photos or use "Try Sample Case".',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'ANALYSIS_FAILED',
        message: `Analysis error: ${errorMsg}. You can try again or use the sample case.`,
      },
      { status: 500 }
    );
  }
}
