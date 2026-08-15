'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}

export const useSpeechRecognition = () => {
  const recognition = useRef<null | typeof window.SpeechRecognition>(null);
  const transcriptRef = useRef('');
  const [finalTranscript, setFinalTranscript] = useState('');

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition not supported in this browser.');
      return;
    }

    recognition.current = new SpeechRecognition();
    recognition.current.interimResults = false;
    recognition.current.continuous = true;
    recognition.current.lang = 'en-US';

    recognition.current.onstart = () => {
      console.log('Speech recognition service has started.');
    };

    recognition.current.onresult = (event) => {
      const parts: string[] = [];
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const text = event.results[index]?.[0]?.transcript;
        if (typeof text === 'string' && text.trim()) {
          parts.push(text.trim());
        }
      }

      if (parts.length === 0) return;
      const next = [transcriptRef.current, parts.join(' ')]
        .filter(Boolean)
        .join(' ')
        .trim();
      transcriptRef.current = next;
      setFinalTranscript(next);
    };

    recognition.current.onerror = (event) => {
      console.warn('Browser speech recognition error:', event.error);
    };

    recognition.current.onend = () => {
      console.log('Speech recognition service has stopped.');
    };

    return () => {
      try {
        recognition.current?.stop();
      } catch {
        // Recognition may already be stopped.
      }
    };
  }, []);

  const resetTranscript = useCallback(() => {
    transcriptRef.current = '';
    setFinalTranscript('');
  }, []);

  const startRecognition = useCallback(() => {
    resetTranscript();
    try {
      recognition.current?.start();
    } catch (error) {
      console.warn('Browser speech recognition could not start:', error);
    }
  }, [resetTranscript]);

  const stopRecognition = useCallback(() => {
    try {
      recognition.current?.stop();
    } catch {
      // Recognition may already be stopped.
    }
  }, []);

  const getFinalTranscript = useCallback(() => transcriptRef.current.trim(), []);

  return {
    startRecognition,
    stopRecognition,
    resetTranscript,
    getFinalTranscript,
    finalTranscript,
  };
};
