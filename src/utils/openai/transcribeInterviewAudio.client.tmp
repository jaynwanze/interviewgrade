'use client';

type TranscriptionResponse = {
  text?: string;
  error?: string;
};

export const transcribeInterviewAudio = async (
  formData: FormData,
): Promise<string> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 55_000);

  try {
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    let payload: TranscriptionResponse = {};
    try {
      payload = (await response.json()) as TranscriptionResponse;
    } catch {
      // Keep the safe default below when a proxy returns a non-JSON error.
    }

    if (!response.ok) {
      throw new Error(
        payload.error || `Transcription failed with status ${response.status}.`,
      );
    }

    if (typeof payload.text !== 'string' || !payload.text.trim()) {
      throw new Error('No speech was detected in the recording.');
    }

    return payload.text.trim();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Transcription timed out.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
};
