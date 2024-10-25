'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any; // For Safari
  }
}

export const useSpeechRecognition = () => {
  const recognition = useRef<SpeechRecognition | null>(null);
  const [finalTranscript, setFinalTranscript] = useState<string>('');

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('SpeechRecognition not supported in this browser.');
      return;
    }

    recognition.current = new SpeechRecognition();
    recognition.current.interimResults = false; // Only final results
    recognition.current.continuous = true; // Continuous recognition
    recognition.current.lang = 'en-US';

    recognition.current.onstart = () => {
      console.log('Speech recognition service has started.');
    };

    recognition.current.onresult = (event) => {
      // Append new transcript results without duplication
      const transcript = event.results[event.resultIndex][0].transcript;
      setFinalTranscript((prev) => prev + ' ' + transcript); // Append new transcript
      console.log('Final transcription result:', transcript);
    };

    recognition.current.onerror = (event) => {
      console.error('Error during transcription:', event.error);
    };

    recognition.current.onend = () => {
      console.log('Speech recognition service has stopped.');
    };

    return () => {
      recognition.current?.stop(); // Stop the recognition on cleanup
    };
  }, []);

  const startRecognition = () => {
    recognition.current?.start(); // Start the recognition
  };

  const stopRecognition = () => {
    setFinalTranscript(''); // Clear the final transcript
    recognition.current?.stop(); // Explicitly stop recognition
  };

  return { startRecognition, stopRecognition, finalTranscript };
};
