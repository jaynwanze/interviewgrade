'use client';

import { MicrophoneIcon } from '@heroicons/react/solid';
import { Loader2, StopCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Meter } from '@/components/Interviews/InterviewFlow/SoundMeter';
import { Button } from '@/components/ui/button';
import { transcribeInterviewAudio } from '@/utils/openai/transcribeInterviewAudio';
import { MediaRecorderHandler } from '@/utils/webspeech/mediaRecorder';
import { useSpeechRecognition } from '@/utils/webspeech/speechRecognition';

type PracticeVoiceRecorderProps = {
  onAnswer: (answer: string) => void;
  disabled?: boolean;
  maxRecordingSeconds?: number;
};

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

export function PracticeVoiceRecorder({
  onAnswer,
  disabled = false,
  maxRecordingSeconds = 120,
}: PracticeVoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [micPermissionState, setMicPermissionState] = useState<
    'granted' | 'denied' | 'prompt' | null
  >(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderHandlerRef = useRef<MediaRecorderHandler | null>(null);
  const timerRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);

  const {
    startRecognition,
    stopRecognition,
    resetTranscript,
    getFinalTranscript,
  } = useSpeechRecognition();

  useEffect(() => {
    async function checkMicPermission() {
      try {
        const permission = await navigator.permissions.query({
          name: 'microphone' as PermissionName,
        });
        setMicPermissionState(permission.state);
        permission.onchange = () => setMicPermissionState(permission.state);
      } catch (permissionError) {
        console.warn('Microphone permission state is unavailable:', permissionError);
      }
    }

    void checkMicPermission();
  }, []);

  useEffect(() => {
    async function prepareMicrophone() {
      try {
        setError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: microphoneConstraints,
        });
        mediaStreamRef.current = stream;

        const AudioContextConstructor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        audioContextRef.current = new AudioContextConstructor();

        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }

        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          setIsMicMuted(audioTrack.muted);
          audioTrack.addEventListener('mute', () => setIsMicMuted(true));
          audioTrack.addEventListener('unmute', () => setIsMicMuted(false));
        }
      } catch (microphoneError) {
        console.error('PracticeVoiceRecorder: microphone setup failed', microphoneError);
        setError(
          'Microphone access failed. Check your browser permissions and available input device.',
        );
      }
    }

    void prepareMicrophone();

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

      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;

      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [resetTranscript, stopRecognition]);

  const finishRecording = useCallback(async () => {
    if (!isRecordingRef.current) return;

    isRecordingRef.current = false;
    setIsRecording(false);
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsTranscribing(true);
    setError(null);
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
            setWarning(
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

      onAnswer(transcript.trim());
      resetTranscript();
    } catch (recordingError) {
      const message =
        recordingError instanceof Error
          ? recordingError.message
          : 'Your answer could not be transcribed.';
      console.error('PracticeVoiceRecorder: recording failed', recordingError);
      setError(
        message.includes('No speech')
          ? message
          : 'Your audio could not be transcribed. Please record your answer again.',
      );
    } finally {
      setIsTranscribing(false);
    }
  }, [getFinalTranscript, onAnswer, resetTranscript, stopRecognition]);

  function startRecording() {
    if (disabled || isTranscribing || isRecordingRef.current) return;

    if (micPermissionState === 'denied') {
      setError(
        'Microphone access is blocked. Allow microphone access in your browser settings.',
      );
      return;
    }

    setError(null);
    setWarning(null);
    setRecordingTime(0);
    setIsRecording(true);
    isRecordingRef.current = true;
    resetTranscript();
    startRecognition();

    try {
      if (audioContextRef.current?.state === 'suspended') {
        void audioContextRef.current.resume();
      }

      if (mediaStreamRef.current) {
        const mediaHandler = new MediaRecorderHandler();
        mediaRecorderHandlerRef.current = mediaHandler;
        mediaHandler.start(mediaStreamRef.current);
      } else {
        setWarning(
          'Audio recording fallback is active. Keep speaking normally until you finish.',
        );
      }
    } catch (mediaError) {
      console.warn('MediaRecorder unavailable; using speech recognition fallback', mediaError);
      mediaRecorderHandlerRef.current = null;
      setWarning(
        'Audio recording fallback is active. Keep speaking normally until you finish.',
      );
    }

    timerRef.current = window.setInterval(() => {
      setRecordingTime((previous) => {
        const next = previous + 1;
        if (next >= maxRecordingSeconds) {
          void finishRecording();
        }
        return next;
      });
    }, 1000);
  }

  const status = isTranscribing
    ? 'Preparing your answer…'
    : isRecording
      ? `Listening · ${recordingTime}s`
      : 'Tap to answer';
  const helper = isTranscribing
    ? 'Transcribing your response'
    : isRecording
      ? 'Speak naturally, then tap again to finish'
      : 'Answer naturally when you are ready';

  return (
    <div
      className="flex w-full flex-col items-center text-center"
      data-practice-voice-recorder
      data-recorder-state={isTranscribing ? 'transcribing' : isRecording ? 'recording' : 'ready'}
    >
      <div className="min-h-10">
        <div className="text-sm font-medium text-foreground">{status}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{helper}</div>
      </div>

      <div className="mt-3 flex h-10 min-w-44 items-center justify-center sm:h-11">
        {isRecording && mediaStreamRef.current && audioContextRef.current ? (
          <Meter
            audioContext={audioContextRef.current}
            stream={mediaStreamRef.current}
            settings={{ bars: 24, spacing: 2, width: 3, height: 34 }}
          />
        ) : isTranscribing ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <div className="flex items-center gap-1 opacity-35" aria-hidden="true">
            {[10, 17, 24, 14, 20, 12, 16].map((height, index) => (
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
            type="button"
            onClick={() => void finishRecording()}
            disabled={isTranscribing}
            aria-label="Stop recording"
            className="h-16 w-16 rounded-full border border-red-400/35 bg-red-500/15 p-0 text-red-300 shadow-[0_10px_35px_rgba(239,68,68,0.10)] transition-transform hover:bg-red-500/25 active:scale-95"
          >
            <StopCircle className="h-6 w-6" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={startRecording}
            disabled={disabled || isTranscribing}
            aria-label="Record answer"
            className="h-16 w-16 rounded-full border border-primary/30 bg-primary/15 p-0 text-primary shadow-[0_10px_35px_rgba(125,211,252,0.10)] transition-transform hover:bg-primary/20 active:scale-95 disabled:opacity-45"
          >
            {isTranscribing ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <MicrophoneIcon className="h-6 w-6" />
            )}
          </Button>
        )}
      </div>

      {warning && (
        <p className="mt-3 max-w-lg text-xs leading-5 text-amber-600">{warning}</p>
      )}
      {error && (
        <p className="mt-3 max-w-lg text-xs leading-5 text-red-500">{error}</p>
      )}
      {isMicMuted && (
        <p className="mt-3 text-xs text-red-500">
          Your microphone is muted. Please unmute to record audio.
        </p>
      )}
    </div>
  );
}