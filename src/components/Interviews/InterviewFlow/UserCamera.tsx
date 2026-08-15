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

function audioFileName(blob: Blob): string {
  const mimeType = blob.type.toLowerCase();
  if (mimeType.includes('mp4')) return 'answer.mp4';
  if (mimeType.includes('ogg')) return 'answer.ogg';
  if (mimeType.includes('wav')) return 'answer.wav';
  return 'answer.webm';
}

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
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [micPermissionState, setMicPermissionState] = useState<
    'granted' | 'denied' | 'prompt' | null
  >(null);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderHandlerRef = useRef<MediaRecorderHandler | null>(null);
  const timerRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);
  const whisperFinalTranscript = useRef<string | null>(null);

  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const { startRecognition, stopRecognition, finalTranscript } =
    useSpeechRecognition();
  const pathname = usePathname();

  void interviewMode;
  void showPermissionDialog;

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
        setProcessingError(
          'Camera or microphone access failed. Check your browser permissions and try again.',
        );
      }
    };

    if (isCameraOn) {
      void startCamera();
    }

    return () => {
      isRecordingRef.current = false;
      if (timerRef.current != null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (mediaRecorderHandlerRef.current?.isRecording()) {
        void mediaRecorderHandlerRef.current.stop();
      }
      mediaRecorderHandlerRef.current = null;

      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        audioStreamRef.current = null;
      }
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [isCameraOn, pathname]);

  const handleAnswer = useCallback(
    (answer: string) => {
      answerCallback(answer);
      whisperFinalTranscript.current = null;
    },
    [answerCallback],
  );

  const handleEndRecord = useCallback(async () => {
    if (!isRecordingRef.current) return;

    isRecordingRef.current = false;
    setIsRecording(false);
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsTranscribing(true);
    setProcessingError(null);
    isFetchingSpecificFeedback?.(true);

    try {
      let transcript = '';
      const mediaHandler = mediaRecorderHandlerRef.current;

      if (mediaHandler?.isRecording()) {
        const audioBlob = await mediaHandler.stop();
        mediaRecorderHandlerRef.current = null;

        if (!audioBlob) {
          throw new Error('The browser did not produce a usable audio recording.');
        }

        const formData = new FormData();
        formData.append('file', audioBlob, audioFileName(audioBlob));
        transcript = await transcribeInterviewAudio(formData);
        whisperFinalTranscript.current = transcript;
      } else {
        stopRecognition();
        transcript = finalTranscript.trim();
      }

      if (!transcript.trim()) {
        throw new Error('No speech was detected in the recording.');
      }

      handleAnswer(transcript);
      onRecordEnd?.();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Your answer could not be transcribed.';
      console.error('UserCamera: recording/transcription failed', error);
      setProcessingError(
        message.includes('No speech')
          ? message
          : 'Your audio could not be transcribed. Please record your answer again.',
      );
      isFetchingSpecificFeedback?.(false);
    } finally {
      setIsTranscribing(false);
    }
  }, [
    finalTranscript,
    handleAnswer,
    isFetchingSpecificFeedback,
    onRecordEnd,
    stopRecognition,
  ]);

  const handleRecord = () => {
    if (disabled || isTranscribing || isRecordingRef.current) return;
    if (micPermissionState === 'denied') {
      setShowPermissionDialog(true);
      setProcessingError(
        'Microphone access is blocked. Allow microphone access in your browser settings.',
      );
      return;
    }

    setProcessingError(null);
    setIsRecording(true);
    isRecordingRef.current = true;
    setRecordingTime(0);

    try {
      if (audioStreamRef.current) {
        if (audioContextRef.current?.state === 'suspended') {
          void audioContextRef.current.resume();
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
    } catch (error) {
      console.error('UserCamera: recording could not start', error);
      isRecordingRef.current = false;
      setIsRecording(false);
      setProcessingError(
        'Recording could not start. Check your microphone permissions and try again.',
      );
      return;
    }

    timerRef.current = window.setInterval(() => {
      setRecordingTime((prev) => {
        const next = prev + 1;
        if (next >= maxRecordingSeconds) {
          void handleEndRecord();
        }
        return next;
      });
    }, 1000);
  };

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
        <Button
          onClick={handleRecord}
          disabled={isRecording || isTranscribing || disabled}
        >
          <MicrophoneIcon className="h-6 w-6" />
        </Button>
        <Button
          onClick={() => void handleEndRecord()}
          disabled={!isRecording || isTranscribing}
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

      {isTranscribing && (
        <p className="text-sm text-muted-foreground">Transcribing your answer…</p>
      )}

      {processingError && (
        <p className="text-center text-sm text-red-500">{processingError}</p>
      )}

      {isMicMuted && (
        <p className="text-center text-sm text-red-500">
          Your microphone is muted. Please unmute to record audio.
        </p>
      )}
    </div>
  );
};
