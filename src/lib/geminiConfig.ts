import { ThinkingLevel } from '@google/genai';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

export function getGeminiThinkingConfig(model: string) {
  if (model.replace(/^models\//, '') === 'gemini-3.8-flash') {
    return { thinkingLevel: ThinkingLevel.LOW };
  }
  return undefined;
}
