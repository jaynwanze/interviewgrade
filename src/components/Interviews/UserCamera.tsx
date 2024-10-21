'use client';

import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';

export const UserCamera = ({ isCameraOn, onRecordEnd }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const videoRef = useRef(null);
  let timer;

  useEffect(() => {
    let stream;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          const playPromise = videoRef.current.play();

          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                // Automatic playback started!
                // Show playing UI.
              })
              .catch((error) => {
                // Auto-play was prevented
                // Show paused UI.
                console.error('Error playing video:', error);
              });
          }
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
      }
    };

    if (isCameraOn) {
      startCamera();
    }

    return () => {
      // Cleanup the stream when the component unmounts or is toggled off
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [isCameraOn]);

  const handleRecord = () => {
    setIsRecording(true);
    // Start recording logic here (e.g., access webcam)
    timer = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
  };

  const handleEndRecord = () => {
    setIsRecording(false);
    clearInterval(timer);
    onRecordEnd(); // Notify the parent component that recording has ended
  };

  return (
    //add auto play to video if you want to start recording automatically
    <div className="user-camera">
      <video
        ref={videoRef}
        muted
        className="w-full h-auto border border-gray-300 rounded"
      ></video>
      <Button onClick={handleRecord} disabled={isRecording}>
        Start Recording
      </Button>
      <Button onClick={handleEndRecord} disabled={!isRecording}>
        End Recording
      </Button>
      {isRecording && <p>Recording for {recordingTime} seconds...</p>}
    </div>
  );
};
