import { NextRequest, NextResponse } from 'next/server';
import { researchPolicyAndPricing, ResearchRequestPayload } from '../../../lib/research';
import { GeminiTimeoutError, withGeminiDeadline } from '../../../lib/geminiDeadline';

export const dynamic = 'force-dynamic';
export const maxDuration = 180;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '' || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return NextResponse.json(
        {
          error: 'MISSING_API_KEY',
          message:
            'GEMINI_API_KEY is not configured in .env.local. Live web policy & pricing research requires an API key. You can also explore the complete workflow with synthetic research evidence using "Try Sample Case".',
        },
        { status: 400 }
      );
    }

    const body = (await req.json()) as Partial<ResearchRequestPayload>;

    if (!Array.isArray(body.deductions) || body.deductions.length === 0) {
      return NextResponse.json(
        {
          error: 'MISSING_DEDUCTIONS',
          message: 'At least one landlord deduction is required for policy research.',
        },
        { status: 400 }
      );
    }

    const payload: ResearchRequestPayload = {
      managementCompany: body.managementCompany?.trim() || 'Residential Property Management',
      city: body.city?.trim() || 'Austin',
      state: body.state?.trim() || 'TX',
      deductions: body.deductions,
      leaseExcerpt: body.leaseExcerpt?.trim(),
    };

    const results = await withGeminiDeadline((signal) => researchPolicyAndPricing(payload, signal));
    return NextResponse.json(results, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof GeminiTimeoutError) {
      return NextResponse.json(
        {
          error: 'RESEARCH_TIMEOUT',
          message: 'Policy research took too long. Please try again without live research, or use "Try Sample Case".',
        },
        { status: 504 }
      );
    }

    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: 'RESEARCH_FAILED',
        message: `Policy research failed: ${errorMsg}`,
      },
      { status: 500 }
    );
  }
}
