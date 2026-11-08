export async function readApiJson<T>(
  response: Response,
  operation: string,
  validate?: (data: Record<string, unknown>) => boolean
): Promise<T> {
  // Read once: hosting errors can be HTML/plain text even for JSON endpoints.
  let text: string;
  try {
    text = await response.text();
  } catch {
    throw new Error(`${operation} was interrupted while receiving the response. Please try again.`);
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  const record = data && typeof data === 'object' && !Array.isArray(data)
    ? data as Record<string, unknown>
    : null;
  const errorCode = typeof record?.error === 'string' ? record.error : '';
  const timedOut = response.status === 504 || /TIMEOUT|TIMED_OUT|DEADLINE_EXCEEDED/i.test(
    `${response.headers.get('x-vercel-error') || ''} ${errorCode}`
  );

  if (response.status === 413) {
    throw new Error(`${operation} could not accept this request because it is too large. Please use smaller photos or shorten the case details.`);
  }
  if (timedOut) {
    throw new Error(`${operation} timed out. Please try again; for photo analysis, smaller photos may help.`);
  }
  if (response.status === 502 || response.status === 503) {
    throw new Error(`${operation} is temporarily unavailable. Please wait a moment and try again.`);
  }
  if (!response.ok) {
    // Preserve application JSON messages, without exposing raw hosting pages.
    const message = [record?.message, record?.error].find(
      (value): value is string => typeof value === 'string' && Boolean(value.trim()) && !/<[^>]+>/.test(value)
    );
    throw new Error(message || `${operation} failed (HTTP ${response.status}). Please try again.`);
  }
  if (!record || 'error' in record || (validate && !validate(record))) {
    throw new Error(`${operation} returned an unreadable response. The service may have timed out; please try again.`);
  }
  return record as T;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isAnalysisResponse(data: Record<string, unknown>): boolean {
  const totals = data.financialTotals;
  if (
    !Array.isArray(data.findings) || !Array.isArray(data.deductions) ||
    !isObject(data.metadata) || !isObject(totals) ||
    typeof data.comparable !== 'boolean' || typeof data.roomComparisonNotes !== 'string'
  ) return false;

  return [
    'totalClaimed', 'supportedDisputeAmount', 'unsupportedOrNewAmount',
    'uncertainAmount', 'disputedCount', 'acceptedOrUncertainCount',
  ].every((key) => typeof totals[key] === 'number' && Number.isFinite(totals[key])) &&
    isObject(totals.deductionStatuses) && Object.values(totals.deductionStatuses).every((detail) =>
      isObject(detail) &&
      typeof detail.status === 'string' &&
      ['supported_dispute', 'needs_evidence', 'unsupported_tenant_liability'].includes(detail.status) &&
      typeof detail.disputableAmount === 'number' && Number.isFinite(detail.disputableAmount) &&
      typeof detail.reason === 'string' && typeof detail.statusLabel === 'string'
    );
}

export function isResearchResponse(data: Record<string, unknown>): boolean {
  return Array.isArray(data.sources) && Array.isArray(data.marketQuotes) && Array.isArray(data.policyComparisons);
}
