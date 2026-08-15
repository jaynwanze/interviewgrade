import { NextRequest, NextResponse } from 'next/server';

import { createOpenAIClient } from '@/utils/openai/config';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    console.error('Transcription API could not parse form data:', error);
    return NextResponse.json({ error: 'Invalid audio upload.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Audio file is required.' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'The audio recording is empty.' }, { status: 400 });
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: 'The audio recording is too large.' }, { status: 413 });
  }

  try {
    const openai = createOpenAIClient();
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      response_format: 'text',
    });
    const text = typeof transcription === 'string' ? transcription.trim() : '';

    if (!text) {
      return NextResponse.json(
        { error: 'No speech was detected in the recording.' },
        { status: 422 },
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error(
      'Transcription API failed:',
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: 'AI transcription is temporarily unavailable.' },
      { status: 503 },
    );
  }
}
