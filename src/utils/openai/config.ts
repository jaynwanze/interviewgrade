import 'server-only';

import OpenAI from 'openai';

/**
 * InterviewGrade historically used OPENAI_SECRET_KEY while the public setup
 * docs used the standard OPENAI_API_KEY name. Accept both during the v2
 * migration so existing Vercel/local environments keep working.
 */
export function getOpenAIApiKey(): string {
  const apiKey =
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.OPENAI_SECRET_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      'OpenAI API key is missing. Set OPENAI_API_KEY (preferred) or OPENAI_SECRET_KEY.',
    );
  }

  return apiKey;
}

export function hasOpenAIApiKey(): boolean {
  return Boolean(
    process.env.OPENAI_API_KEY?.trim() ||
      process.env.OPENAI_SECRET_KEY?.trim(),
  );
}

export function createOpenAIClient(): OpenAI {
  return new OpenAI({ apiKey: getOpenAIApiKey() });
}
