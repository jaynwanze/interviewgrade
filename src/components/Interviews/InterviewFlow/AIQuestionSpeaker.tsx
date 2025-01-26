// AIQuestionSpeaker.tsx
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { T } from '@/components/ui/Typography';
import { InterviewQuestion } from '@/types';
import Lottie from 'lottie-react';
import talkingInteviewer from 'public/assets/animations/AnimationSpeakingRings.json';
import { useEffect, useRef, useState } from 'react';
import { Avatar3D } from '@/components/Avatar/Avatar3D'; 

export const AIQuestionSpeaker = ({
  question,
  currentIndex,
  questionsLength,
}: {
  question: InterviewQuestion;
  currentIndex: number;
  questionsLength: number;
}) => {
  const speechRef = useRef<SpeechSynthesis | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lottieRef = useRef<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const introText: string =
      'Welcome to the interview session. I will ask you a series of questions. Please answer them to the best of your ability. Let’s begin.';
    const questionSpeechText: string =
      'Question ' + (currentIndex + 1) + ': ' + question.text;
    const speechText: string =
      currentIndex === 0
        ? introText + ' ' + questionSpeechText
        : questionSpeechText;
    const utterance = new SpeechSynthesisUtterance(speechText);
    console.log('Speech Text:', speechText); // Debugging line

    utterance.rate = 0.75; // Set rate (0.1 to 10)
    utterance.pitch = 1; // Set pitch (0 to 2)
    utterance.volume = 1; // Set volume (0 to 1)

    utterance.onstart = () => {
      setIsSpeaking(true);
      if (lottieRef.current) {
        lottieRef.current.setSpeed(1); // Align animation speed with speech rate
        lottieRef.current.play();
      }
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      if (lottieRef.current) {
        lottieRef.current.stop();
      }
      console.log('Speech has finished.');
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      if (lottieRef.current) {
        lottieRef.current.stop();
      }
    };

    // Check for browser support
    if (window.speechSynthesis) {
      speechRef.current = window.speechSynthesis;
      speechRef.current.speak(utterance);
    } else {
      console.error('Speech synthesis not supported in this browser.');
    }

    // Cleanup function to stop any ongoing speech when the question changes
    return () => {
      if (speechRef.current && speechRef.current.speaking) {
        speechRef.current.cancel(); // Stop any ongoing speech
      }
      setIsSpeaking(false);
      if (lottieRef.current) {
        lottieRef.current.stop();
      }
    };
  }, [question, currentIndex]);

  return (
    <div className="ai-speaker">
      <Card className="max-w-md text-center">
        <CardHeader>
          <CardTitle>Interviewer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center">
            <Lottie
              animationData={talkingInteviewer}
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
                <T.Subtle>{question.text}</T.Subtle>
              </CardContent>
            </Card>
          </div>
        </CardContent>
        <span className="bg-gray-100 text-gray-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
          Progress
        </span>
        <CardFooter>
          <Progress
            className="mt-5"
            value={((currentIndex + 1) / questionsLength) * 100}
          ></Progress>
        </CardFooter>
      </Card>
    </div>
  );
};
