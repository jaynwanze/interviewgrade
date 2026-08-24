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
  controlsOverlay?: boolean;
}

function audioFileName(blob: Blob): string {
  const mimeType = blob.type.toLowerCase();
  if (mimeType.includes('mp4')) return 'answer.mp4';
  if (mimeType.includes('ogg')) return 'answer.ogg';
  if (mimeType.includes('wav')) return 'answer.wav';
  return 'answer.webm';
}

const microphoneConstraints: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

async function acquirePracticeMedia(): Promise<{
  stream: MediaStream;
  cameraAvailable: boolean;
}> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: microphoneConstraints,
    });
    return { stream, cameraAvailable: stream.getVideoTracks().length > 0 };
  } catch (error) {
    console.warn(
      'Default camera + microphone request failed; trying microphone only:',
      error,
    );
    const audioOnly = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: microphoneConstraints,
    });
    return { stream: audioOnly, cameraAvailable: false };
  }
}

export const UserCamera: React.FC<UserCameraProps> = ({
  answerCallback,
  isCameraOn,
  onRecordEnd,
  isFetchingSpecificFeedback,
  interviewMode,
  disabled = false,
  maxRecordingSeconds = 120,
  controlsOverlay = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [mediaWarning, setMediaWarning] = useState<string | null>(null);
  const [micPermissionState, setMicPermissionState] = useState<
    'granted' | 'denied' | 'prompt' | null
  >(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderHandlerRef = useRef<MediaRecorderHandler | null>(null);
  const timerRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const {
    startRecognition,
    stopRecognition,
    resetTranscript,
    getFinalTranscript,
  } = useSpeechRecognition();
  const pathname = usePathname();

  void interviewMode;

  useEffect(() => {
    async function checkMicPermission() {
      try {
        const permission = await navigator.permissions.query({
          name: 'microphone' as PermissionName,
        });
        setMicPermissionState(permission.state);
        permission.onchange = () => setMicPermissionState(permission.state);
      } catch (error) {
        console.warn('Microphone permission state is unavailable:', error);
      }
    }
    void checkMicPermission();
  }, []);

  useEffect(() => {
    const startCamera = async () => {
      try {
        setProcessingError(null);
        setMediaWarning(null);

        const { stream, cameraAvailable } = await acquirePracticeMedia();
        mediaStreamRef.current = stream;

        if (!cameraAvailable) {
          setMediaWarning(
            'Camera unavailable. Your microphone still works, so you can continue the practice.',
          );
        }

        audioContextRef.current = new (
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext
        )();
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }

        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          setIsMicMuted(audioTrack.muted);
          audioTrack.addEventListener('mute', () => setIsMicMuted(true));
          audioTrack.addEventListener('unmute', () => setIsMicMuted(false));
        }

        if (videoRef.current) {
          if (cameraAvailable) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          } else {
            videoRef.current.srcObject = null;
          }
        }
      } catch (error) {
        console.error('Error accessing microphone:', error);
        setProcessingError(
          'Microphone access failed. Check your browser permissions and available input device.',
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
      stopRecognition();
      resetTranscript();

      if (mediaRecorderHandlerRef.current?.isRecording()) {
        void mediaRecorderHandlerRef.current.stop();
      }
      mediaRecorderHandlerRef.current = null;

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [isCameraOn, pathname, resetTranscript, stopRecognition]);

  const handleAnswer = useCallback(
    (answer: string) => {
      answerCallback(answer);
      resetTranscript();
    },
    [answerCallback, resetTranscript],
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

    stopRecognition();
    await new Promise((resolve) => window.setTimeout(resolve, 200));
    const browserTranscript = getFinalTranscript();

    try {
      let transcript = browserTranscript;
      const mediaHandler = mediaRecorderHandlerRef.current;

      if (mediaHandler?.isRecording()) {
        const audioBlob = await mediaHandler.stop();
        mediaRecorderHandlerRef.current = null;

        if (!audioBlob) {
          throw new Error('The browser did not produce a usable audio recording.');
        }

        const formData = new FormData();
        formData.append('file', audioBlob, audioFileName(audioBlob));

        try {
          const whisperTranscript = await transcribeInterviewAudio(formData);
          if (typeof whisperTranscript === 'string' && whisperTranscript.trim()) {
            transcript = whisperTranscript.trim();
          }
        } catch (transcriptionError) {
          console.warn(
            'AI transcription failed; trying browser transcript fallback:',
            transcriptionError,
          );
          if (browserTranscript) {
            setMediaWarning(
              'AI transcription was unavailable, so InterviewGrade used the browser transcript for this answer.',
            );
          } else {
            throw transcriptionError;
          }
        }
      }

      if (typeof transcript !== 'string' || !transcript.trim()) {
        throw new Error('No speech was detected in the recording.');
      }

      handleAnswer(transcript.trim());
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
    getFinalTranscript,
    handleAnswer,
    isFetchingSpecificFeedback,
    onRecordEnd,
    stopRecognition,
  ]);

  const handleRecord = () => {
    if (disabled || isTranscribing || isRecordingRef.current) return;
    if (micPermissionState === 'denied') {
      setProcessingError(
        'Microphone access is blocked. Allow microphone access in your browser settings.',
      );
      return;
    }

    setProcessingError(null);
    setMediaWarning(null);
    setIsRecording(true);
    isRecordingRef.current = true;
    setRecordingTime(0);
    resetTranscript();
    startRecognition();

    try {
      if (mediaStreamRef.current) {
        if (audioContextRef.current?.state === 'suspended') {
          void audioContextRef.current.resume();
        }
        const mediaHandler = new MediaRecorderHandler();
        mediaRecorderHandlerRef.current = mediaHandler;
        mediaHandler.start(mediaStreamRef.current);
        console.log('Audio Stream/MediaHandler - Recording started');
      } else {
        console.warn(
          'Media stream unavailable; browser speech recognition is the only transcript source.',
        );
      }
    } catch (error) {
      console.warn(
        'MediaRecorder could not start; continuing with browser speech recognition:',
        error,
      );
      mediaRecorderHandlerRef.current = null;
      setMediaWarning(
        'Audio recording fallback is active. Keep speaking normally until you press stop.',
      );
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

  const recordingControls = (
    <div className="flex items-center justify-center space-x-2 sm:space-x-3">
      <Button
        onClick={handleRecord}
        disabled={isRecording || isTranscribing || disabled}
        className={
          controlsOverlay
            ? 'h-10 w-10 rounded-full p-0 shadow-lg sm:h-11 sm:w-11'
            : undefined
        }
        aria-label="Record answer"
      >
        <MicrophoneIcon className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
      <Button
        onClick={() => void handleEndRecord()}
        disabled={!isRecording || isTranscribing}
        className={`bg-red-500 hover:bg-red-600 ${
          controlsOverlay
            ? 'h-10 w-10 rounded-full p-0 shadow-lg sm:h-11 sm:w-11'
            : ''
        }`}
        aria-label="Stop recording"
      >
        <StopCircle className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
    </div>
  );

  return (
    <div className="flex w-full flex-col items-center space-y-4">
      <div className={`w-full ${controlsOverlay ? 'relative overflow-hidden rounded-md' : ''}`}>
        <video
          ref={videoRef}
          muted
          playsInline
          className={`w-full max-w-full rounded-md border-4 border-blue-300 object-cover shadow-sm ${
            controlsOverlay ? 'aspect-video h-full max-h-[min(62vh,640px)]' : 'h-auto'
          }`}
        />

        {controlsOverlay && isRecording && mediaStreamRef.current && audioContextRef.current && (
          <div className="pointer-events-none absolute inset-x-0 bottom-16 flex justify-center sm:bottom-20">
            <div className="scale-90 rounded-full border border-white/15 bg-black/50 px-2 py-1.5 shadow-lg backdrop-blur-sm sm:scale-100 sm:px-3 sm:py-2">
              <Meter
                audioContext={audioContextRef.current}
                stream={mediaStreamRef.current}
                settings={{ bars: 18, spacing: 2, width: 3, height: 28 }}
              />
            </div>
          </div>
        )}

        {controlsOverlay && (
          <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center sm:bottom-4">
            <div className="pointer-events-auto rounded-full border border-white/15 bg-black/55 p-1.5 shadow-xl backdrop-blur-sm sm:p-2">
              {recordingControls}
            </div>
          </div>
        )}

        {controlsOverlay && (isRecording || isTranscribing) && (
          <div className="absolute left-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm sm:left-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-xs">
            {isTranscribing ? 'Transcribing…' : `Recording ${recordingTime}s`}
          </div>
        )}
      </div>

      {!controlsOverlay && recordingControls}

      {isRecording && mediaStreamRef.current && audioContextRef.current && !controlsOverlay && (
        <div className="flex w-full items-center justify-center">
          <div className="rounded-xl bg-gray-100 p-2 shadow-sm dark:bg-gray-800">
            <Meter
              audioContext={audioContextRef.current}
              stream={mediaStreamRef.current}
              settings={{ bars: 30, spacing: 2, width: 5, height: 40 }}
            />
          </div>
        </div>
      )}

      {isRecording && !controlsOverlay && (
        <p className="text-sm text-muted-foreground">
          Recording for {recordingTime} seconds...
        </p>
      )}

      {isTranscribing && !controlsOverlay && (
        <p className="text-sm text-muted-foreground">Transcribing your answer…</p>
      )}

      {mediaWarning && (
        <p className="text-center text-sm text-amber-600">{mediaWarning}</p>
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
