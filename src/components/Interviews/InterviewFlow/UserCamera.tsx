'use client';

import { Button } from '@/components/ui/button';
import { transcribeInterviewAudio } from '@/utils/openai/transcribeInterviewAudio';
import { MediaRecorderHandler } from '@/utils/webspeech/mediaRecorder';
import { useSpeechRecognition } from '@/utils/webspeech/speechRecognition';
import { MicrophoneIcon } from '@heroicons/react/solid';
import { StopCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Meter } from './SoundMeter';

interface UserCameraProps {
  answerCallback: (answer: string) => void;
  isCameraOn: boolean;
  onRecordEnd: null | (() => void);
  isFetchingSpecificFeedback?: (isFetching: boolean) => void;
  interviewMode: string | null;
  disabled?: boolean;
  maxRecordingSeconds?: number;
}

const getPreferredVideoDeviceId = async (): Promise<string | undefined> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(
      (device) => device.kind === 'videoinput',
    );
    const exclusionKeywords = [
      'android',
      'phone',
      'external',
      'virtual',
      'usb',
      'wireless',
    ];
    const preferredDevice = videoDevices.find((device) => {
      const label = device.label.toLowerCase();
      return !exclusionKeywords.some((keyword) => label.includes(keyword));
    });
    stream.getTracks().forEach((track) => track.stop());
    return preferredDevice ? preferredDevice.deviceId : undefined;
  } catch (error) {
    console.error('Error selecting preferred video device:', error);
    return undefined;
  }
};

export const UserCamera: React.FC<UserCameraProps> = ({
  answerCallback,
  isCameraOn,
  onRecordEnd,
  isFetchingSpecificFeedback,
  interviewMode,
  disabled = false,
  maxRecordingSeconds = 120,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [micPermissionState, setMicPermissionState] = useState<
    'granted' | 'denied' | 'prompt' | null
  >(null);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderHandlerRef = useRef<MediaRecorderHandler | null>(null);
  const timerRef = useRef<number | null>(null);
  const whisperFinalTranscript = useRef<string | null>(null);
  const [isLoadingFFmpeg, setIsLoadingFFmpeg] = useState(false);

  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const { startRecognition, stopRecognition, finalTranscript } =
    useSpeechRecognition();
  const pathname = usePathname();

  // Keep the existing media implementation intact while allowing newer
  // session players to control when another recording may begin.
  void interviewMode;
  void showPermissionDialog;
  void isLoadingFFmpeg;

  useEffect(() => {
    async function checkMicPermission() {
      try {
        const permission = await navigator.permissions.query({
          name: 'microphone' as PermissionName,
        });
        setMicPermissionState(permission.state);
        if (permission.state === 'denied') {
          setShowPermissionDialog(true);
        }
        permission.onchange = () => {
          setMicPermissionState(permission.state);
          if (permission.state === 'denied') {
            setShowPermissionDialog(true);
          } else {
            setShowPermissionDialog(false);
          }
        };
      } catch (error) {
        console.error('Error checking microphone permission:', error);
      }
    }
    checkMicPermission();
  }, []);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const deviceId = await getPreferredVideoDeviceId();
        const constraints: MediaStreamConstraints = {
          video: deviceId
            ? { deviceId: { exact: deviceId } }
            : { facingMode: 'user' },
          audio: true,
        };
        const mediaStream =
          await navigator.mediaDevices.getUserMedia(constraints);
        audioStreamRef.current = mediaStream;

        audioContextRef.current = new (
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext
        )();
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }

        const audioTracks = mediaStream.getAudioTracks();
        if (audioTracks.length > 0) {
          setIsMicMuted(audioTracks[0].muted);
          audioTracks[0].addEventListener('mute', () => {
            console.log('Microphone muted');
            setIsMicMuted(true);
          });
          audioTracks[0].addEventListener('unmute', () => {
            console.log('Microphone unmuted');
            setIsMicMuted(false);
          });
        }

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
      mediaRecorderHandlerRef.current?.stop(setIsLoadingFFmpeg);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        audioStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [isCameraOn, pathname]);

  const handleAnswer = (answer: string) => {
    answerCallback(answer);
    whisperFinalTranscript.current = null;
  };

  const handleRecord = () => {
    if (disabled) return;
    if (micPermissionState === 'denied') {
      setShowPermissionDialog(true);
      return;
    }
    setIsRecording(true);
    setRecordingTime(0);
    if (audioStreamRef.current) {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
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
        if (prev + 1 >= maxRecordingSeconds) {
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
    if (isFetchingSpecificFeedback) {
      isFetchingSpecificFeedback(true);
    }
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
        console.error('Audio conversion failed');
        if (isFetchingSpecificFeedback) {
          isFetchingSpecificFeedback(false);
        }
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
      onRecordEnd();
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
    <div className="flex w-full flex-col items-center space-y-4">
      <div className="w-full">
        <video
          ref={videoRef}
          muted
          playsInline
          className="h-auto w-full max-w-full rounded-md border-4 border-blue-300 object-cover shadow-sm"
        />
      </div>

      <div className="flex items-center justify-center space-x-4">
        <Button onClick={handleRecord} disabled={isRecording || disabled}>
          <MicrophoneIcon className="h-6 w-6" />
        </Button>
        <Button
          onClick={handleEndRecord}
          disabled={!isRecording}
          className="bg-red-500 hover:bg-red-600"
        >
          <StopCircle className="h-6 w-6" />
        </Button>
      </div>

      {isRecording && audioStreamRef.current && audioContextRef.current && (
        <div className="flex w-full items-center justify-center">
          <div className="rounded-xl bg-gray-100 p-2 shadow-sm dark:bg-gray-800">
            <Meter
              audioContext={audioContextRef.current}
              stream={audioStreamRef.current}
              settings={{ bars: 30, spacing: 2, width: 5, height: 40 }}
            />
          </div>
        </div>
      )}

      {isRecording && (
        <p className="text-sm text-muted-foreground">
          Recording for {recordingTime} seconds...
        </p>
      )}

      {isMicMuted && (
        <p className="text-center text-sm text-red-500">
          Your microphone is muted. Please unmute to record audio.
        </p>
      )}
    </div>
  );
};
