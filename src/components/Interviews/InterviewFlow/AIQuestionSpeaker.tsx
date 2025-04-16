'use client';

import { T } from '@/components/ui/Typography';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { InterviewQuestion } from '@/types';
import { generateTTS } from '@/utils/openai/textToSpeech';
import Lottie from 'lottie-react';
import talkingInterviewer from 'public/assets/animations/AnimationSpeakingRings.json';
import { useEffect, useRef, useState } from 'react';

const colors = [
  'bg-blue-100',
  'bg-red-100',
  'bg-green-100',
  'bg-yellow-100',
  'bg-purple-100',
  'bg-pink-100',
  'bg-indigo-100',
];

const darkColors = [
  'bg-blue-700',
  'bg-red-700',
  'bg-green-700',
  'bg-yellow-700',
  'bg-purple-700',
  'bg-pink-700',
  'bg-indigo-700',
];

const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];
const getRandomDarkColor = () =>
  darkColors[Math.floor(Math.random() * darkColors.length)];

export const AIQuestionSpeaker = ({
  question,
  currentIndex,
  questionsLength,
}: {
  question: InterviewQuestion;
  currentIndex: number;
  questionsLength: number;
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lottieRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [randomColor, setRandomColor] = useState<string>(getRandomColor());
  const [randomDarkColor, setRandomDarkColor] =
    useState<string>(getRandomDarkColor());
  const prevQuestionIndexRef = useRef<number | null>(null);
  useEffect(() => {
    setRandomColor(getRandomColor());
    setRandomDarkColor(getRandomDarkColor());
  }, [question]);

  // Control Lottie animation based solely on isSpeaking.
  useEffect(() => {
    if (lottieRef.current) {
      if (isSpeaking) {
        lottieRef.current.setSpeed(1);
        lottieRef.current.play();
      } else {
        lottieRef.current.stop();
      }
    }
  }, [isSpeaking]);

  useEffect(() => {
    // Only speak when the current question index is different from the previous one.
    if (prevQuestionIndexRef.current === currentIndex) {
      return;
    }
    prevQuestionIndexRef.current = currentIndex;

    const introText =
      "Welcome to the interview session. I will ask you a series of questions. Please answer them to the best of your ability. Let's begin.";
    const questionSpeechText =
      'Question ' + (currentIndex + 1) + ': ' + question.text;
    const speechText =
      currentIndex === 0
        ? introText + ' ' + questionSpeechText
        : questionSpeechText;

    const speak = async () => {
      try {
        // Stop any previous audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        const audioUrl = await generateTTS(speechText, 'tts-1', 'alloy');
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => {
          setIsSpeaking(false);
          console.log('Speech has finished.');
        };
        audio.onerror = (error) => {
          console.error('Audio playback error:', error);
          setIsSpeaking(false);
        };
        audio.play();
        setIsSpeaking(true);
      } catch (error) {
        console.error('TTS error:', error);
        setIsSpeaking(false);
      }
    };

    speak();

    // Cleanup: stop any audio when question changes.
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsSpeaking(false);
    };
  }, [question, currentIndex]);

  return (
    <Card className="ai-speaker w-full h-full overflow-hidden flex flex-col justify-between">
      <CardHeader className="p-4 border-b dark:border-gray-700 bg-muted/50 mb-2">
        <CardTitle className="text-lg font-semibold">
          Interviewer
        </CardTitle>
      </CardHeader>
      <div className="flex justify-center items-center">
        <span className="bg-gray-200 text-gray-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-gray-600 dark:text-gray-200">
          Avery
        </span>
      </div>
      <CardContent className="">
        <div className="flex justify-center items-center">
          <Lottie
            animationData={talkingInterviewer}
            loop={true}
            autoplay={false}
            lottieRef={lottieRef}
            style={{ width: 400, height: 226 }}
          />
        </div>
        <div className="flex justify-center items-center">
          <Card className="max-w-25 text-center">
            <CardHeader>
              <CardTitle>Question {currentIndex + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <span
                className={`${randomColor} text-gray-800 text-s font-semibold px-2.5 py-0.5 rounded dark:${randomDarkColor} dark:text-gray-300`}
              >
                {question.evaluation_criteria.name}
              </span>
              <T.Subtle className="mt-2">{question.text}</T.Subtle>
            </CardContent>
          </Card>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-center">
        <span className="text-center bg-gray-100 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
          Progress
        </span>
        <Progress
          className="mt-5"
          value={((currentIndex + 1) / questionsLength) * 100}
        />
      </CardFooter>
    </Card>
  );
};
