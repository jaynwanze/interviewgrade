import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createOpenAIClient } from '@/utils/openai/config';

export const runtime = 'nodejs';
export const maxDuration = 30;

const requestSchema = z.object({
  text: z.string().trim().min(1).max(5000),
  model: z.string().trim().min(1).default('tts-1'),
  voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).default('alloy'),
});

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid text-to-speech request.' }, { status: 400 });
  }

  try {
    const openai = createOpenAIClient();
    const speech = await openai.audio.speech.create({
      model: parsed.data.model,
      voice: parsed.data.voice,
      input: parsed.data.text,
    });

    const audio = await speech.arrayBuffer();
    return new Response(audio, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error(
      'TTS API failed:',
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: 'AI question audio is temporarily unavailable.' },
      { status: 503 },
    );
  }
}
