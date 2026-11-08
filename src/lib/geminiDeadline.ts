export const GEMINI_TIMEOUT_MS = 150_000;

export class GeminiTimeoutError extends Error {
  constructor() {
    super('Gemini did not finish before the application deadline.');
    this.name = 'GeminiTimeoutError';
  }
}

// Race the complete operation so an unresponsive SDK cannot hold the route open.
export async function withGeminiDeadline<T>(
  work: (signal: AbortSignal) => Promise<T>,
  timeoutMs = GEMINI_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      // Settle our recognizable error before cancellation rejects the SDK call.
      reject(new GeminiTimeoutError());
      controller.abort();
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      Promise.resolve().then(() => work(controller.signal)),
      deadline,
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
