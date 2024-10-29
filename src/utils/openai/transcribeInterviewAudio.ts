'use server';

import axios from 'axios';
import FormData from 'form-data';

// Ensure that the environment variable is loaded
const openAiKey = process.env.NEXT_PUBLIC_OPENAI_SECRET_KEY;

if (!openAiKey) {
  throw new Error('OPENAI_SECRET_KEY is not defined');
}

// Function to transcribe audio using OpenAI Whisper API
export const transcribeInterviewAudio = async (audioBlob: Blob) => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm'); // Add the audio file
  formData.append('model', 'whisper-1'); // Specify the model here
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
    console.log('Transcription:', response.data.text); // Use the transcription result
    return response.data.text; // Return the transcription for further processing
  } catch (error) {
    console.error('Error transcribing audio:', error);
  }
};
