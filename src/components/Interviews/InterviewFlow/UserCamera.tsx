// UserCamera.tsx
'use client';

import { Button } from '@/components/ui/button';
import { transcribeInterviewAudio } from '@/utils/openai/transcribeInterviewAudio';
import { MediaRecorderHandler } from '@/utils/webspeech/mediaRecorder';
import { useSpeechRecognition } from '@/utils/webspeech/speechRecognition';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Meter } from './SoundMeter';
import { set } from 'nprogress';

interface UserCameraProps {
  answerCallback: (answer: string) => void;
  isCameraOn: boolean;
  onRecordEnd: null | (() => void);
  isFetchingSpecificFeedback: (isFetching: boolean) => void;
  interviewMode: string | null;
}

// Helper function to get the preferred video device ID
const getPreferredVideoDeviceId = async (): Promise<string | undefined> => {
  try {
    // Request permission to access video to get device labels
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(
      (device) => device.kind === 'videoinput',
    );

    // Define exclusion keywords for unwanted devices
    const exclusionKeywords = [
      'android',
      'phone',
      'external',
      'virtual',
      'usb',
      'wireless',
    ];

    // Attempt to find a preferred device
    const preferredDevice = videoDevices.find((device) => {
      const label = device.label.toLowerCase();
      // Exclude devices that match any of the exclusion keywords
      return !exclusionKeywords.some((keyword) => label.includes(keyword));
    });

    // Stop all tracks to release the temporary stream
    stream.getTracks().forEach((track) => track.stop());

    return preferredDevice ? preferredDevice.deviceId : undefined;
  } catch (error) {
    console.error('Error selecting preferred video device:', error);
    return undefined;
  }
};

// UserCamera component to handle video and audio recording and display a sound meter
export const UserCamera: React.FC<UserCameraProps> = ({
  answerCallback,
  isCameraOn,
  onRecordEnd,
  isFetchingSpecificFeedback,
  interviewMode,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isGettingFeedback, setIsGettingFeedback] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderHandlerRef = useRef<MediaRecorderHandler | null>(null);
  const timerRef = useRef<number | null>(null); // Ref for timer
  const whisperFinalTranscript = useRef<string | null>(null); // Ref for final transcript
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
    const startCamera = async () => {
      try {
        const deviceId = await getPreferredVideoDeviceId();
        const constraints: MediaStreamConstraints = {
          video: deviceId
            ? { deviceId: { exact: deviceId } }
            : { facingMode: 'user' }, // Fallback to 'user' if no deviceId
          audio: true,
        };
        // Get webcam and microphone stream
        const mediaStream =
          await navigator.mediaDevices.getUserMedia(constraints);
        audioStreamRef.current = mediaStream;

        // Initialize AudioContext
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
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
      // Stop MediaRecorder if it's active
      mediaRecorderHandlerRef.current?.stop(setIsLoadingFFmpeg);

      // Stop all media tracks
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        audioStreamRef.current = null;
      }

      // Close AudioContext unconditionally
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [isCameraOn, pathname]);

  const handleAnswer = (answer: string) => {
    answerCallback(answer);
    whisperFinalTranscript.current = null; // Reset the final transcript
  };

  const handleRecord = () => {
    setIsRecording(true);
    setRecordingTime(0);
    if (audioStreamRef.current) {
      const mediaHandler = new MediaRecorderHandler();
      mediaRecorderHandlerRef.current = mediaHandler;
      mediaHandler.start(audioStreamRef.current);
      console.log('Audio Stream/MediaHandler - Recording started');
    } else {
      startRecognition();
      console.log('Webkit Speech Recognition - Recording started');
      console.log('Audio stream/MediaHandler not available');
    }
    timerRef.current = window.setInterval(() => {
      setRecordingTime((prev) => {
        if (prev + 1 >= 120) {
          handleEndRecord();
        }
        return prev + 1;
      });
    }, 1000);
  };

  const handleEndRecord = useCallback(async () => {
    if (!isRecording) return;
    setIsRecording(false);
    clearInterval(timerRef.current!);
    isFetchingSpecificFeedback(true);

    if (mediaRecorderHandlerRef.current) {
      const convertedAudioBlob =
        await mediaRecorderHandlerRef.current.stop(setIsLoadingFFmpeg);

      if (convertedAudioBlob) {
        const formData = new FormData();
        formData.append('file', convertedAudioBlob, 'audio.mp3');
        formData.append('model', 'whisper-1');
        whisperFinalTranscript.current =
          await transcribeInterviewAudio(formData);
      } else {
        // Handle error when audio conversion fails
        //create a way for them to retry question if it fails
        console.error(
          'Audio conversion failed - returning error message to display to user',
        );
        isFetchingSpecificFeedback(false);
        return;
      }
    } else {
      stopRecognition();
    }

    const webSpeechTranscript = finalTranscript.trim();
    whisperFinalTranscript.current
      ? handleAnswer(whisperFinalTranscript.current)
      : handleAnswer(webSpeechTranscript);

    if (onRecordEnd) {
      onRecordEnd(); // Notify the parent component that recording has ended
    }
  }, [
    isRecording,
    stopRecognition,
    finalTranscript,
    answerCallback,
    onRecordEnd,
    isFetchingSpecificFeedback,
  ]);

  return (
    <div className="user-camera">
      <video
        ref={videoRef}
        muted
        className="w-full h-auto border-4 border-gray-300 rounded mb-5"
        playsInline
      ></video>
      <div className="flex justify-center items-center space-x-5 mb-10">
        <Button className="mr-4" onClick={handleRecord} disabled={isRecording}>
          Start Recording
        </Button>
        <Button onClick={handleEndRecord} disabled={!isRecording}>
          End Recording
        </Button>
      </div>
      {isRecording && audioStreamRef.current && audioContextRef.current && (
        <div className="mt-5">
          <Meter
            audioContext={audioContextRef.current}
            stream={audioStreamRef.current}
            settings={{ bars: 30, spacing: 2, width: 10, height: 50 }}
          />
        </div>
      )}
      {isRecording && (
        <p className="mt-2">Recording for {recordingTime} seconds...</p>
      )}
    </div>
  );
};
