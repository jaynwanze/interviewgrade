'use server';

import { createOpenAIClient } from './config';

// Function to transcribe audio using the server-side OpenAI audio endpoint.
export const transcribeInterviewAudio = async (
  formData: FormData,
): Promise<string> => {
  const file = formData.get('file');

  if (!(file instanceof File)) {
    throw new Error('File is missing in the form data.');
  }

  try {
    // whisper-1 remains supported and accepts browser-native WebM directly.
    const openai = createOpenAIClient();
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      response_format: 'text',
    });

    return transcription;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transcription failed';
    console.error('Error transcribing audio:', message);
    throw new Error('Transcription failed. Please try recording your answer again.');
  }
};
