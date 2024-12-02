'use client';

import React, { useEffect, useRef, useState } from 'react';

interface CandlestickMeterProps {
  audioContext: AudioContext;
  stream: MediaStream;
  width?: number; // Optional: Width of the meter
  height?: number; // Optional: Max height of the meter
}

export const CandlestickMeter: React.FC<CandlestickMeterProps> = ({
  audioContext,
  stream,
  width = 20,
  height = 100,
}) => {
  const [level, setLevel] = useState(0); // Current audio level (0 to 1)
  const animationRef = useRef<number | null>(null);
  const meterRef = useRef<HTMLDivElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    // Initialize AnalyserNode for time-domain data
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048; // Higher fftSize for better resolution
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;

    // Function to calculate RMS and update level
    const updateMeter = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;

      analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

      // Calculate RMS
      let sum = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        const sample = (dataArrayRef.current[i] - 128) / 128; // Normalize between -1 and 1
        sum += sample * sample;
      }
      const rms = Math.sqrt(sum / dataArrayRef.current.length);
      setLevel(rms);

      animationRef.current = requestAnimationFrame(updateMeter);
    };

    // Add a small delay before starting the meter update loop
    const startMeter = () => {
      setTimeout(updateMeter, 100);
    };

    startMeter(); // Start the loop

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }
    };
  }, [audioContext, stream]);

  // Determine color based on level
  const getColor = (level: number): string => {
    if (level < 0.1) return '#FFFF00'; // Yellow
    if (level < 0.2) return '#00FF00'; // Green
    if (level < 0.3) return '#FFA500'; // Orange
    return '#FF0000'; // Red
  };

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        border: '2px solid #ccc',
        borderRadius: '5px',
        backgroundColor: '#f0f0f0',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
      }}
      aria-label="Audio Level Meter"
      role="meter"
      aria-valuenow={Math.round(level * 3 * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        ref={meterRef}
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          height: `${level * 3 * 100}%`,
          backgroundColor: getColor(level),
          transition: 'height 0.1s ease-out, background-color 0.1s ease-out',
        }}
      ></div>
    </div>
  );
};
