// File: app/actions/tts.ts
'use server';

import { createOpenAIClient } from './config';

// generateTTS converts input text to spoken audio using OpenAI's TTS endpoint.
export async function generateTTS(
  text: string,
  model: string = 'tts-1',
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy',
): Promise<string> {
  if (!text.trim()) {
    throw new Error('No text provided');
  }

  // Resolve OpenAI configuration at request time so a missing key does not
  // crash route/module evaluation during a production build.
  const openai = createOpenAIClient();
  const mp3 = await openai.audio.speech.create({
    model,
    voice,
    input: text,
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  const base64Audio = buffer.toString('base64');
  return `data:audio/mp3;base64,${base64Audio}`;
}
