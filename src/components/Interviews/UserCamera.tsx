'use client';

import { Button } from '@/components/ui/button';
import { transcribeInterviewAudio } from '@/utils/openai/transcribeInterviewAudio';
import { MediaRecorderHandler } from '@/utils/webspeech/mediaRecorder';
import { useSpeechRecognition } from '@/utils/webspeech/speechRecognition';
import { useCallback, useEffect, useRef, useState } from 'react';

// UserCamera component to handle video and audio recording
export const UserCamera = ({ answerCallback, isCameraOn, onRecordEnd }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderHandlerRef = useRef<MediaRecorderHandler | null>(null);
  const timerRef = useRef<number | null>(null); // Ref for timer
  const whisperFinalTranscript = useRef<string>(''); // Ref for final transcript
  const [isLoadingFFmpeg, setIsLoadingFFmpeg] = useState(false); // Loading state for FFmpeg

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

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
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

    const mediaHandler = new MediaRecorderHandler();
    mediaRecorderHandlerRef.current = mediaHandler;
    mediaHandler.start(videoRef.current!.srcObject as MediaStream);
    timerRef.current = window.setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
    console.log('Recording started');
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
    whisperFinalTranscript.current != '' || null || undefined
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
      <Button
        className="mt-4 mr-4"
        onClick={handleRecord}
        disabled={isRecording}
      >
        Start Recording
      </Button>
      <Button onClick={handleEndRecord} disabled={!isRecording}>
        End Recording
      </Button>
      {isRecording && <p>Recording for {recordingTime} seconds...</p>}
    </div>
  );
};
