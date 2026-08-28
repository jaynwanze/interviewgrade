'use client';

import {
  beginSpeechPlaybackRequest,
  cancelSpeechPlaybackRequests,
  isSpeechPlaybackRequestCurrent,
} from './speechPlaybackState';

function automaticSpeechStorageKey(text: string): string {
  let hash = 5381;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 33) ^ text.charCodeAt(index);
  }
  return `interviewgrade:auto-spoken:${hash >>> 0}`;
}

export async function generateTTS(
  text: string,
  model: string = 'tts-1',
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy',
): Promise<string> {
  if (!text.trim()) {
    throw new Error('No text provided');
  }

  const userActivated =
    typeof navigator !== 'undefined' && navigator.userActivation?.isActive === true;

  if (typeof window !== 'undefined' && !userActivated) {
    const storageKey = automaticSpeechStorageKey(text);
    if (window.sessionStorage.getItem(storageKey) === '1') {
      cancelSpeechPlaybackRequests();
      throw new DOMException('Automatic question audio already played.', 'AbortError');
    }
    window.sessionStorage.setItem(storageKey, '1');
  }

  const generation = beginSpeechPlaybackRequest();
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model, voice }),
  });

  if (!isSpeechPlaybackRequestCurrent(generation)) {
    throw new DOMException('Question audio request was cancelled.', 'AbortError');
  }

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
  if (!isSpeechPlaybackRequestCurrent(generation)) {
    throw new DOMException('Question audio request was cancelled.', 'AbortError');
  }

  if (audio.size === 0) {
    throw new Error('AI question audio returned an empty response.');
  }

  return URL.createObjectURL(audio);
}

export function releaseTTSUrl(url: string | null | undefined) {
  if (!url) {
    cancelSpeechPlaybackRequests();
    return;
  }

  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
