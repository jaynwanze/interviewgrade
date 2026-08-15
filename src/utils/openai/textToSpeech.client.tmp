'use client';

export async function generateTTS(
  text: string,
  model: string = 'tts-1',
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy',
): Promise<string> {
  if (!text.trim()) {
    throw new Error('No text provided');
  }

  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model, voice }),
  });

  if (!response.ok) {
    let message = 'AI question audio is temporarily unavailable.';
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) message = payload.error;
    } catch {
      // Keep the safe default message.
    }
    throw new Error(message);
  }

  const audio = await response.blob();
  if (audio.size === 0) {
    throw new Error('AI question audio returned an empty response.');
  }

  return URL.createObjectURL(audio);
}

export function releaseTTSUrl(url: string | null | undefined) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
