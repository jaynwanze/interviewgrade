// UserCamera.tsx
'use client';

import { Button } from '@/components/ui/button';
import { transcribeInterviewAudio } from '@/utils/openai/transcribeInterviewAudio';
import { MediaRecorderHandler } from '@/utils/webspeech/mediaRecorder';
import { useSpeechRecognition } from '@/utils/webspeech/speechRecognition';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CandlestickMeter } from './CandleStickMeter';
interface UserCameraProps {
  answerCallback: (answer: string) => void;
  isCameraOn: boolean;
  onRecordEnd: null | (() => void);
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
  const durationRef = useRef<number | null>(null); // Ref for duration
  const [durationTime, setDurationTime] = useState<number>(0); // Ref for duration
  const whisperFinalTranscript = useRef<string>(''); // Ref for final transcript
  const [isLoadingFFmpeg, setIsLoadingFFmpeg] = useState(false); // Loading state for FFmpeg

  // Refs for audio stream and context
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Use speech recognition
  const { startRecognition, stopRecognition, finalTranscript } =
    useSpeechRecognition();

  const pathname = usePathname();
  const previousPathname = useRef<string | null>(pathname);

  useEffect(() => {
    let stream: MediaStream;

    if (durationRef.current == null) {
      durationRef.current = window.setInterval(() => {
        setDurationTime((prev) => prev + 1);
      }, 1000);
    }

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
      if (stream || pathname !== previousPathname.current) {
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
        videoRef.current ? (videoRef.current.srcObject = null) : null;
        audioContextRef.current?.close();
        audioContextRef.current = null;
      }
      mediaRecorderHandlerRef.current?.stop(setIsLoadingFFmpeg); // Ensure the recorder stops

      // Clean up AudioContext
      if (audioContextRef.current || pathname !== previousPathname.current) {
        audioContextRef.current?.close();
        audioContextRef.current = null;
      }

      // Clear the duration interval
      if (durationRef.current || pathname !== previousPathname.current) {
        if (durationRef.current !== null) {
          clearInterval(durationRef.current);
        }
        durationRef.current = null;
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
        setRecordingTime((prev) => {
          if (prev + 1 >= 120) {
            handleEndRecord();
          }
          return prev + 1;
        });
      }, 1000);
      console.log('Recording started');
    } else {
      console.error('Audio stream is not available.');
    }
  };

  const handleEndRecord = useCallback(async () => {
    if (!isRecording) return; // Prevent multiple calls

    setIsRecording(false);
    clearInterval(timerRef.current!); // Clear timer when recording ends
    stopRecognition(); // Stop speech recognition

    if (mediaRecorderHandlerRef.current) {
      const convertedAudioBlob =
        await mediaRecorderHandlerRef.current.stop(setIsLoadingFFmpeg);

      if (convertedAudioBlob) {
        const formData = new FormData();
        formData.append('file', convertedAudioBlob, 'audio.mp3');
        formData.append('model', 'whisper-1');
        whisperFinalTranscript.current =
          await transcribeInterviewAudio(formData);
      }
    }

    const webSpeechTranscript = finalTranscript.trim();
    whisperFinalTranscript.current
      ? handleAnswer(whisperFinalTranscript.current)
      : handleAnswer(webSpeechTranscript);

    if (onRecordEnd) {
      onRecordEnd(); // Notify the parent component that recording has ended
    }
  }, [stopRecognition, finalTranscript, answerCallback, onRecordEnd]);

  return (
    <div className="user-camera">
      <video
        ref={videoRef}
        muted
        className="w-full h-auto border-4 border-gray-300 rounded mb-5"
      ></video>
      {/* Candlestick Sound Meter */}

      <div className="flex justify-center items-center space-x-5">
        <Button className="mr-4" onClick={handleRecord} disabled={isRecording}>
          Start Recording
        </Button>
        <Button onClick={handleEndRecord} disabled={!isRecording}>
          End Recording
        </Button>
        {audioStreamRef.current && audioContextRef.current && (
          <CandlestickMeter
            audioContext={audioContextRef.current}
            stream={audioStreamRef.current}
            width={30}
            height={100}
          />
        )}
      </div>
      {isRecording && (
        <p className="mt-2">Recording for {recordingTime} seconds...</p>
      )}
      <p className="mt-2"> duration: {durationTime} seconds</p>
    </div>
  );
};
