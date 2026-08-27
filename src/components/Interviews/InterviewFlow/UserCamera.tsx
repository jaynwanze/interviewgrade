'use client';

import { Button } from '@/components/ui/button';
import { transcribeInterviewAudio } from '@/utils/openai/transcribeInterviewAudio';
import { MediaRecorderHandler } from '@/utils/webspeech/mediaRecorder';
import { useSpeechRecognition } from '@/utils/webspeech/speechRecognition';
import { MicrophoneIcon } from '@heroicons/react/solid';
import { Loader2, StopCircle } from 'lucide-react';
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

async function acquirePracticeMedia(audioOnly = false): Promise<{
  stream: MediaStream;
  cameraAvailable: boolean;
}> {
  if (audioOnly) {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: microphoneConstraints,
    });
    return { stream, cameraAvailable: false };
  }

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
    const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: microphoneConstraints,
    });
    return { stream: audioOnlyStream, cameraAvailable: false };
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

  const audioFirstPractice = interviewMode === 'Practice' && controlsOverlay;

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
    const startMedia = async () => {
      try {
        setProcessingError(null);
        setMediaWarning(null);

        const { stream, cameraAvailable } = await acquirePracticeMedia(audioFirstPractice);
        mediaStreamRef.current = stream;

        if (!audioFirstPractice && !cameraAvailable) {
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
      void startMedia();
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
  }, [
    audioFirstPractice,
    isCameraOn,
    pathname,
    resetTranscript,
    stopRecognition,
  ]);

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

  if (audioFirstPractice) {
    const status = isTranscribing
      ? 'Transcribing your answer…'
      : isRecording
        ? `Listening · ${recordingTime}s`
        : 'Ready when you are';

    return (
      <div className="practice-voice-recorder relative isolate flex w-full flex-col items-center overflow-hidden py-5 text-center sm:py-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl sm:h-56 sm:w-56"
        />

        <div className="text-xs font-medium tracking-wide text-muted-foreground">
          {status}
        </div>

        <div className="mt-3 flex h-10 min-w-40 items-center justify-center sm:h-12">
          {isRecording && mediaStreamRef.current && audioContextRef.current ? (
            <Meter
              audioContext={audioContextRef.current}
              stream={mediaStreamRef.current}
              settings={{ bars: 28, spacing: 2, width: 3, height: 34 }}
            />
          ) : isTranscribing ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <div className="flex items-center gap-1 opacity-35" aria-hidden="true">
              {[10, 18, 26, 16, 22, 12, 18].map((height, index) => (
                <span
                  key={`${height}-${index}`}
                  className="w-1 rounded-full bg-muted-foreground"
                  style={{ height }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-3">
          {isRecording ? (
            <Button
              onClick={() => void handleEndRecord()}
              disabled={isTranscribing}
              aria-label="Stop recording"
              className="h-12 w-12 rounded-full border border-red-400/30 bg-red-500/15 p-0 text-red-200 shadow-[0_10px_32px_hsl(var(--foreground)/0.08)] hover:bg-red-500/25 sm:h-14 sm:w-14"
            >
              <StopCircle className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          ) : (
            <Button
              onClick={handleRecord}
              disabled={isTranscribing || disabled}
              aria-label="Record answer"
              className="h-12 w-12 rounded-full border border-primary/25 bg-primary/15 p-0 text-primary shadow-[0_10px_32px_hsl(var(--foreground)/0.08)] hover:bg-primary/20 sm:h-14 sm:w-14"
            >
              {isTranscribing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <MicrophoneIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </Button>
          )}
        </div>

        <p className="mt-3 max-w-md px-4 text-xs leading-5 text-muted-foreground/75">
          {isRecording
            ? 'Speak naturally. Finish when you are ready.'
            : 'Your answer is recorded as audio and transcribed when you finish.'}
        </p>

        {mediaWarning && (
          <p className="mt-3 max-w-lg px-4 text-center text-xs text-amber-600">
            {mediaWarning}
          </p>
        )}

        {processingError && (
          <p className="mt-3 max-w-lg px-4 text-center text-xs text-red-500">
            {processingError}
          </p>
        )}

        {isMicMuted && (
          <p className="mt-3 text-center text-xs text-red-500">
            Your microphone is muted. Please unmute to record audio.
          </p>
        )}
      </div>
    );
  }

  const recordingControls = (
    <div className="flex items-center justify-center space-x-1.5 sm:space-x-2">
      <Button
        onClick={handleRecord}
        disabled={isRecording || isTranscribing || disabled}
        className={
          controlsOverlay
            ? 'h-9 w-9 rounded-full border border-white/30 bg-white/85 p-0 text-black shadow-md hover:bg-white/95 sm:h-10 sm:w-10'
            : undefined
        }
        aria-label="Record answer"
      >
        <MicrophoneIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
      </Button>
      <Button
        onClick={() => void handleEndRecord()}
        disabled={!isRecording || isTranscribing}
        className={`bg-red-500/90 hover:bg-red-500 ${
          controlsOverlay
            ? 'h-9 w-9 rounded-full border border-white/20 p-0 shadow-md sm:h-10 sm:w-10'
            : ''
        }`}
        aria-label="Stop recording"
      >
        <StopCircle className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
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
          <div className="pointer-events-none absolute inset-x-0 bottom-16 hidden justify-center sm:flex">
            <div className="rounded-full border border-white/15 bg-black/25 px-3 py-1.5 shadow-md backdrop-blur-xl">
              <Meter
                audioContext={audioContextRef.current}
                stream={mediaStreamRef.current}
                settings={{ bars: 18, spacing: 2, width: 3, height: 24 }}
              />
            </div>
          </div>
        )}

        {controlsOverlay && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 hidden justify-center sm:flex">
            <div className="pointer-events-auto rounded-full border border-white/15 bg-black/25 p-1.5 shadow-lg backdrop-blur-xl">
              {recordingControls}
            </div>
          </div>
        )}

        {controlsOverlay && (
          <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center sm:hidden">
            <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/15 bg-black/25 px-1.5 py-1 shadow-lg backdrop-blur-xl">
              {isRecording && mediaStreamRef.current && audioContextRef.current && (
                <div className="pointer-events-none flex min-w-[54px] items-center justify-center px-1">
                  <Meter
                    audioContext={audioContextRef.current}
                    stream={mediaStreamRef.current}
                    settings={{ bars: 11, spacing: 1, width: 2, height: 16 }}
                  />
                </div>
              )}
              {recordingControls}
            </div>
          </div>
        )}

        {controlsOverlay && (isRecording || isTranscribing) && (
          <div className="absolute left-2 top-2 rounded-full border border-white/15 bg-black/25 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm backdrop-blur-xl sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-xs">
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