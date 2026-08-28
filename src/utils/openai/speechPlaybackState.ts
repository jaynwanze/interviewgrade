'use client';

let playbackGeneration = 0;
let playbackCancelled = false;

export function beginSpeechPlaybackRequest(): number {
  playbackCancelled = false;
  playbackGeneration += 1;
  return playbackGeneration;
}

export function cancelSpeechPlaybackRequests() {
  playbackCancelled = true;
  playbackGeneration += 1;
}

export function isSpeechPlaybackRequestCurrent(generation: number): boolean {
  return !playbackCancelled && generation === playbackGeneration;
}

export function isSpeechPlaybackCancelled(): boolean {
  return playbackCancelled;
}
