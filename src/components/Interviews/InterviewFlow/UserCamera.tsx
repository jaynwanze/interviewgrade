// UserCamera.tsx
'use client';

import { Button } from '@/components/ui/button';
import { transcribeInterviewAudio } from '@/utils/openai/transcribeInterviewAudio';
import { MediaRecorderHandler } from '@/utils/webspeech/mediaRecorder';
import { useSpeechRecognition } from '@/utils/webspeech/speechRecognition';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CandlestickMeter } from './CandleStickMeter'; // Adjust the path as needed

// Define TypeScript interfaces for props if needed
interface UserCameraProps {
  answerCallback: (answer: string) => void;
  isCameraOn: boolean;
  onRecordEnd: () => void;
}

// UserCamera component to handle video and audio recording and display a sound meter
export const UserCamera: React.FC<UserCameraProps> = ({
  answerCallback,
  isCameraOn,
  onRecordEnd,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderHandlerRef = useRef<MediaRecorderHandler | null>(null);
  const timerRef = useRef<number | null>(null); // Ref for timer
  const whisperFinalTranscript = useRef<string>(''); // Ref for final transcript
  const [isLoadingFFmpeg, setIsLoadingFFmpeg] = useState(false); // Loading state for FFmpeg

  // Refs for audio stream and context
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Use speech recognition
  const { startRecognition, stopRecognition, finalTranscript } =
    useSpeechRecognition();

  useEffect(() => {
    let stream: MediaStream;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        // Save the audio stream to ref for CandlestickMeter
        audioStreamRef.current = stream;

        // Initialize AudioContext
        audioContextRef.current = new (window.AudioContext ||
          (
            window as typeof window & {
              webkitAudioContext: typeof AudioContext;
            }
          ).webkitAudioContext)();

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error('Error accessing webcam and microphone:', err);
      }
    };

    if (isCameraOn) {
      startCamera();
    }

    return () => {
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
      mediaRecorderHandlerRef.current?.stop(setIsLoadingFFmpeg); // Ensure the recorder stops

      // Clean up AudioContext
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [isCameraOn]);

  const handleAnswer = (answer: string) => {
    answerCallback(answer);
    whisperFinalTranscript.current = ''; // Reset the final transcript
  };

  const handleRecord = () => {
    setIsRecording(true);
    setRecordingTime(0);
    startRecognition(); // Start speech recognition

    if (audioStreamRef.current) {
      const mediaHandler = new MediaRecorderHandler();
      mediaRecorderHandlerRef.current = mediaHandler;
      mediaHandler.start(audioStreamRef.current);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      console.log('Recording started');
    } else {
      console.error('Audio stream is not available.');
    }
  };

  const handleEndRecord = useCallback(async () => {
    setIsRecording(false);
    clearInterval(timerRef.current!); // Clear timer when recording ends
    stopRecognition(); // Stop speech recognition

    if (mediaRecorderHandlerRef.current) {
      const convertedAudioBlob =
        await mediaRecorderHandlerRef.current.stop(setIsLoadingFFmpeg);

      if (convertedAudioBlob) {
        const formData = new FormData();
        formData.append('file', convertedAudioBlob, 'audio.webm'); // Add the audio file
        formData.append('model', 'whisper-1'); // Specify the model here
        whisperFinalTranscript.current =
          await transcribeInterviewAudio(formData); // Save the final transcript
      }
    }

    const webSpeechTranscript = finalTranscript.trim(); // Get the final transcript
    whisperFinalTranscript.current
      ? handleAnswer(whisperFinalTranscript.current)
      : handleAnswer(webSpeechTranscript);

    onRecordEnd(); // Notify the parent component that recording has ended
  }, [stopRecognition, finalTranscript, answerCallback, onRecordEnd]);

  return (
    <div className="user-camera">
      <video
        ref={videoRef}
        muted
        className="w-full h-auto border-4 border-gray-300 rounded"
      ></video>

      {/* Candlestick Sound Meter */}
      {audioStreamRef.current && audioContextRef.current && (
        <div className="mt-4 flex items-end justify-center">
          <CandlestickMeter
            audioContext={audioContextRef.current}
            stream={audioStreamRef.current}
            width={30} // Adjust width as needed
            height={100} // Adjust height as needed
          />
        </div>
      )}

      <div className="mt-4">
        <Button className="mr-4" onClick={handleRecord} disabled={isRecording}>
          Start Recording
        </Button>
        <Button onClick={handleEndRecord} disabled={!isRecording}>
          End Recording
        </Button>
      </div>
      {isRecording && (
        <p className="mt-2">Recording for {recordingTime} seconds...</p>
      )}
    </div>
  );
};
