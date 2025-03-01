// File: app/actions/tts.ts
'use server';

import OpenAI from 'openai';

const openAiKey = process.env.OPENAI_SECRET_KEY;
if (!openAiKey) {
  throw new Error(
    'OpenAI API key is missing. Please set OPENAI_SECRET_KEY in your environment variables.',
  );
}

const openai = new OpenAI({
  apiKey: openAiKey,
});

//generateTTS converts input text to spoken audio using OpenAI's TTS endpoint.
export async function generateTTS(
  text: string,
  model: string = 'tts-1',
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy',
): Promise<string> {
  if (!text) {
    throw new Error('No text provided');
  }
  // Call OpenAI's TTS endpoint.
  const mp3 = await openai.audio.speech.create({
    model,
    voice,
    input: text,
  });

  // Convert the response (ArrayBuffer) to a base64 URL.
  const buffer = Buffer.from(await mp3.arrayBuffer());
  const base64Audio = buffer.toString('base64');
  return `data:audio/mp3;base64,${base64Audio}`;
}
