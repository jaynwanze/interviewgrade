'use client';

import { useEffect, useRef } from 'react';

interface MeterProps {
  audioContext: AudioContext;
  stream: MediaStream;
  settings?: {
    bars: number;
    spacing: number;
    width: number;
    height: number;
  };
}

const defaultSettings = {
  bars: 30,
  spacing: 6,
  width: 10,
  height: 200,
};

export const Meter: React.FC<MeterProps> = ({
  audioContext,
  stream,
  settings = defaultSettings,
}) => {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const volume = useRef(0);
  const volumeRefs = useRef<number[]>(new Array(settings.bars).fill(0));

  useEffect(() => {
    // 1. Create an AnalyserNode
    const analyser = audioContext.createAnalyser();
    analyser.smoothingTimeConstant = 0.4;
    analyser.fftSize = 1024;

    // 2. Connect microphone -> analyser
    const microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);

    // 3. Poll the analyser in a loop
    let rafId: number;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateMeter = () => {
      analyser.getByteFrequencyData(dataArray);

      let values = 0;
      const length = dataArray.length;
      for (let i = 0; i < length; i++) {
        values += dataArray[i];
      }
      volume.current = values / length;

      // update UI in next effect
      rafId = requestAnimationFrame(updateMeter);
    };

    updateMeter(); // kick off the loop

    // Clean up
    return () => {
      microphone.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [audioContext, stream]);

  // 4. Animate the meter bars (e.g. via setInterval or a separate rAF)
  useEffect(() => {
    const intervalId = setInterval(() => {
      volumeRefs.current.unshift(volume.current);
      volumeRefs.current.pop();
      for (let i = 0; i < refs.current.length; i++) {
        const ref = refs.current[i];
        if (ref) {
          // scale the bar based on average volume
          ref.style.transform = `scaleY(${volumeRefs.current[i] / 100})`;
        }
      }
    }, 50);

    return () => clearInterval(intervalId);
  }, [settings.bars]);

  // 5. Render the bars
  const createElements = () => {
    const elements: JSX.Element[] = [];
    for (let i = 0; i < settings.bars; i++) {
      elements.push(
        <div
          key={`meter-${i}`}
          ref={(ref) => {
            refs.current[i] = ref;
          }}
          style={{
            position: 'absolute',
            background: 'lightblue',
            borderRadius: `${settings.width / 2}px`,
            width: `${settings.width}px`,
            height: `${settings.height}px`,
            left: `${i * (settings.width + settings.spacing)}px`,
            bottom: '0px',
            transformOrigin: 'bottom',
            transition: 'transform 0.1s ease-out',
          }}
        />
      );
    }
    return elements;
  };

  return (
    <div
      style={{
        position: 'relative',
        width: `${settings.bars * (settings.width + settings.spacing)}px`,
        height: `${settings.height}px`,
      }}
    >
      {createElements()}
    </div>
  );
};
