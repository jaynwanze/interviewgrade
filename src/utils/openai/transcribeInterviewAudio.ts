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
// Function to transcribe audio using the server-side API route
export const transcribeInterviewAudio = async (
  formData: FormData,
): Promise<string> => {
  const file = formData.get('file') as File;

  if (!file) {
    throw new Error('File is missing in the form data.');
  }

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      response_format: 'text',
    });
    return transcription; // Return the transcription
  } catch (error) {
    console.error(
      'Error transcribing audio:',
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data?.error?.message || 'Transcription failed',
    );
  }
};
