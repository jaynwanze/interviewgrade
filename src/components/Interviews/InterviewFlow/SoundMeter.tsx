// Meter.tsx
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
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

    analyser.smoothingTimeConstant = 0.4;
    analyser.fftSize = 1024;

    microphone.connect(analyser);
    analyser.connect(javascriptNode);
    javascriptNode.connect(audioContext.destination);

    javascriptNode.onaudioprocess = () => {
      const array = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(array);
      let values = 0;
      const length = array.length;
      for (let i = 0; i < length; i++) {
        values += array[i];
      }
      volume.current = values / length;
    };

    return () => {
      microphone.disconnect();
      analyser.disconnect();
      javascriptNode.disconnect();
    };
  }, [audioContext, stream, settings.bars]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      volumeRefs.current.unshift(volume.current);
      volumeRefs.current.pop();
      for (let i = 0; i < refs.current.length; i++) {
        const ref = refs.current[i];
        if (ref) {
          ref.style.transform = `scaleY(${volumeRefs.current[i] / 100})`;
        }
      }
    }, 20);

    return () => {
      clearInterval(intervalId);
    };
  }, [settings.bars]);

  const createElements = () => {
    const elements: JSX.Element[] = [];

    for (let i = 0; i < settings.bars; i++) {
      elements.push(
        <div
          ref={(ref) => {
            refs.current[i] = ref;
          }}
          key={`meter-${i}`}
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
        />,
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
