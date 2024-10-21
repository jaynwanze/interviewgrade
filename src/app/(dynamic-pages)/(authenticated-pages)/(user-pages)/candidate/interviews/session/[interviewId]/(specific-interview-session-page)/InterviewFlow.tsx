'use client';
import { UserCamera } from '@/components/Interviews/UserCamera';
import { T } from '@/components/ui/Typography';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useEffect, useRef, useState } from 'react';

// Mock AI component for speaking questions
const AIQuestionSpeaker = ({ question, currentIndex, questionsLength }) => {
  // Mock AI component for speaking questions
  const speechRef = useRef(null);

  useEffect(() => {
    // intro text
    const introText: string =
      'Welcome to the interview session. I will ask you a series of questions. Please answer them to the best of your ability. Let’s begin.';
    const questionSpeechText: string =
      'Question ' + (currentIndex + 1) + ': ' + question;
    const speechText: string =
      currentIndex === 0
        ? introText + ' ' + questionSpeechText
        : questionSpeechText;
    const utterance = new SpeechSynthesisUtterance(speechText);

    utterance.rate = 0.65; // Set rate (0.1 to 10)
    utterance.pitch = 1; // Set pitch (0 to 2)
    utterance.volume = 1; // Set volume (0 to 1)

    utterance.onend = () => {
      console.log('Speech has finished.');
    };
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
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
    };
  }, [question]);
  return (
    <div className="ai-speaker">
      <Card className="max-w-md text-center">
        <CardHeader>
          <CardTitle>Interviewer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center">
            <Card className="max-w-25 text-center mb-10">
              <CardHeader>
                <CardTitle>Animated Charter</CardTitle>
              </CardHeader>
            </Card>
          </div>
          <div className="flex justify-center items-center">
            <Card className=" max-w-25 text-center">
              <CardHeader>
                <CardTitle>Question {currentIndex + 1}</CardTitle>
              </CardHeader>
              <CardContent>
                <T.Subtle>{question}</T.Subtle>
              </CardContent>
            </Card>
          </div>
        </CardContent>
        <span class="bg-gray-100 text-gray-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
          Progress
        </span>
        <CardFooter>
          <Progress
            className="mt-5"
            value={((currentIndex + 1) / questionsLength) * 100}
            total={questionsLength}
          ></Progress>
        </CardFooter>
      </Card>
    </div>
  );
};

export default function InterviewFlow() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false); // Track if the camera is on

  // Example questions array (you might fetch this from an API)
  const questions = [
    'What is your experience with JavaScript?',
    'Can you describe a time when you faced a challenge?',
    'How do you prioritize your tasks?',
  ];

  const handleNextQuestion = () => {
    // Save fresponse to the current question
    // remove feedback

    // Check if the interview is complete
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsInterviewComplete(true);
      setIsCameraOn(false); // Turn off the camera when interview is complete
    }
  };

  const handleSaveInterviewState = () => {
    // Implement logic to save interview state
    // You could call an API to save the state here
  };

  return (
    <div className="interview-flow-container flex justify-center items-center min-h-screen">
      {!isInterviewComplete ? (
        <div className="flex w-full max-w-4xl">
          <div className="left-side w-1/2 p-4">
            <AIQuestionSpeaker
              question={questions[currentQuestionIndex]}
              currentIndex={currentQuestionIndex}
              questionsLength={questions.length}
            />
          </div>
          <div className="right-side w-1/2 p-4">
            <Card className="max-w-md text-center">
              <CardHeader>
                <CardTitle>Candidate</CardTitle>
              </CardHeader>
              <CardContent>
                <UserCamera
                  isCameraOn={true}
                  onRecordEnd={handleNextQuestion}
                />
                <textarea
                  placeholder="Transcript"
                  className="mt-4 w-full p-2 border border-gray-300 rounded"
                  disabled
                />
                <Button className="mt-4" onClick={handleNextQuestion}>
                  Next Question
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <T.Subtle>Interview Completed!</T.Subtle>
          <T.Subtle className="text-2xl mt-4">AI Score: 90%</T.Subtle>
        </div>
      )}
    </div>
  );
}
