export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}
