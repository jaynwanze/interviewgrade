'use client';

import { Button } from '@/components/ui/button';
import { transcribeInterviewAudio } from '@/utils/openai/transcribeInterviewAudio';
import { MediaRecorderHandler } from '@/utils/webspeech/mediaRecorder';
import { useSpeechRecognition } from '@/utils/webspeech/speechRecognition';
import { useEffect, useRef, useState } from 'react';

// UserCamera component to handle video and audio recording
export const UserCamera = ({ answerCallback, isCameraOn, onRecordEnd }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderHandlerRef = useRef<MediaRecorderHandler | null>(null);
  const timerRef = useRef<number | null>(null); // Ref for timer
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
      mediaRecorderHandlerRef.current?.stop(); // Ensure the recorder stops
    };
  }, [isCameraOn]);

  const handleRecord = () => {
    setIsRecording(true);
    setRecordingTime(0);
    startRecognition(); // Start speech recognition
    mediaRecorderHandlerRef.current = new MediaRecorderHandler(
      async (audioBlob) => {
        const transcript = await transcribeInterviewAudio(audioBlob); // Transcribe the audio
        //answerCallback(transcript); // Pass the final transcript back to the parent
      },
    );

    if (mediaRecorderHandlerRef.current) {
      mediaRecorderHandlerRef.current.start(
        videoRef.current!.srcObject as MediaStream,
      );
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const handleEndRecord = () => {
    setIsRecording(false);
    stopRecognition(); // Stop speech recognition
    // Pass the final transcript back to the parent
    const transcript = finalTranscript.trim(); // Get the final transcript
    answerCallback(transcript);
    // if null get open ai transcript
    console.log('Final transcript:', transcript);
    clearInterval(timerRef.current!); // Clear timer when recording ends
    if (mediaRecorderHandlerRef.current) {
      mediaRecorderHandlerRef.current.stop(); // Stop recording and trigger onstop
    }
    onRecordEnd(); // Notify the parent component that recording has ended
  };

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
