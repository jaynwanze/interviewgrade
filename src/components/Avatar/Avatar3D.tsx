// Avatar3D.tsx (Updated)
'use client';

import React, { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import { AnimationMixer, Group } from 'three';

interface Avatar3DProps {
  glbUrl: string;
  isSpeaking: boolean;
}

const AvatarModel: React.FC<{ glbUrl: string; isSpeaking: boolean }> = ({
  glbUrl,
  isSpeaking,
}) => {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(glbUrl);
  const mixer = useRef<AnimationMixer>();
  const currentAction = useRef<string>('Idle');

  useEffect(() => {
    if (animations.length && group.current) {
      mixer.current = new AnimationMixer(group.current);
      // Assume the first animation is 'Idle' and the second is 'Speak'
      const idleClip = animations.find((clip) =>
        clip.name.toLowerCase().includes('idle'),
      );
      const speakClip = animations.find((clip) =>
        clip.name.toLowerCase().includes('speak'),
      );

      if (idleClip && speakClip) {
        const idleAction = mixer.current.clipAction(idleClip, group.current);
        const speakAction = mixer.current.clipAction(speakClip, group.current);

        idleAction.play(); // Start with idle animation
        currentAction.current = 'Idle';
      } else {
        console.warn('Idle or Speak animations not found in the GLB.');
      }
    }

    return () => {
      mixer.current?.stopAllAction();
    };
  }, [animations]);

  useEffect(() => {
    if (!mixer.current || animations.length === 0) return;

    const idleClip = animations.find((clip) =>
      clip.name.toLowerCase().includes('idle'),
    );
    const speakClip = animations.find((clip) =>
      clip.name.toLowerCase().includes('speak'),
    );

    if (idleClip && speakClip) {
      const idleAction = mixer.current.clipAction(idleClip, group.current);
      const speakAction = mixer.current.clipAction(speakClip, group.current);

      if (isSpeaking) {
        idleAction.fadeOut(0.2);
        speakAction.reset().fadeIn(0.2).play();
        currentAction.current = 'Speak';
      } else {
        speakAction.fadeOut(0.2);
        idleAction.reset().fadeIn(0.2).play();
        currentAction.current = 'Idle';
      }
    }
  }, [isSpeaking, animations]);

  useFrame((state, delta) => {
    mixer.current?.update(delta);
  });

  return <primitive ref={group} object={scene} />;
};

export const Avatar3D: React.FC<Avatar3DProps> = ({ glbUrl, isSpeaking }) => {
  return (
    <Canvas
      camera={{ position: [0, 1, 10], fov: 25 }}
      style={{ width: 400, height: 400 }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <Suspense fallback={<Html>Loading...</Html>}>
        <AvatarModel glbUrl={glbUrl} isSpeaking={isSpeaking} />
      </Suspense>
      <OrbitControls enablePan={false} enableZoom={false} />
    </Canvas>
  );
};
