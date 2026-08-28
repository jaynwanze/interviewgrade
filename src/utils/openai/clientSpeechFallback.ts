'use client';

import { isSpeechPlaybackCancelled } from './speechPlaybackState';

export function speakWithBrowserVoice(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
): boolean {
  if (
    typeof window === 'undefined' ||
    isSpeechPlaybackCancelled() ||
    !('speechSynthesis' in window) ||
    typeof SpeechSynthesisUtterance === 'undefined'
  ) {
    return false;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopBrowserVoice() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
