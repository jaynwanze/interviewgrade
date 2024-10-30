'use server';

import axios from 'axios';

// Ensure that the environment variable is loaded
const openAiKey = process.env.OPENAI_SECRET_KEY;

if (!openAiKey) {
  throw new Error('OPENAI_SECRET_KEY is not defined');
}

// Function to transcribe audio using OpenAI Whisper API
export const transcribeInterviewAudio = async (formData: FormData) => {
  
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',

      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${openAiKey}`, // Use Bearer token for authorization
        },
      },
    );
    return response.data.text; // Return the transcription for further processing
  } catch (error) {
    console.error('Error transcribing audio:', error);
  }
};
