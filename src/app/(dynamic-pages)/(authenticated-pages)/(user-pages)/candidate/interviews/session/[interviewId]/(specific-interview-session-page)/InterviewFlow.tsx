'use client';
import { T } from '@/components/ui/Typography';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useEffect, useState } from 'react';
import { UserCamera } from '@/components/Interviews/UserCamera';

// Mock AI component for speaking questions
const AIQuestionSpeaker = ({ question }) => {
  return (
    <div className="ai-speaker">
      <T.Subtle>{question}</T.Subtle>
    </div>
  );
};


export default function InterviewFlow() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [userFeedback, setUserFeedback] = useState('');
  const [isCameraOn, setIsCameraOn] = useState(false); // Track if the camera is on

  // Example questions array (you might fetch this from an API)
  const questions = [
    'What is your experience with JavaScript?',
    'Can you describe a time when you faced a challenge?',
    'How do you prioritize your tasks?',
  ];

  const handleNextQuestion = () => {
    // Save feedback before moving to the next question (optional)
    if (userFeedback) {
      console.log(
        `Feedback for Question ${currentQuestionIndex + 1}: ${userFeedback}`,
      );
    }

    // Check if the interview is complete
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserFeedback(''); // Reset feedback for the next question
    } else {
      setIsInterviewComplete(true);
      setIsCameraOn(false); // Turn off the camera when interview is complete
    }
  };

  const handleSaveInterviewState = () => {
    // Implement logic to save interview state
    console.log('Interview state saved');
    // You could call an API to save the state here
  };

  return (
    <div className="interview-flow-container flex">
      <div className="left-side w-1/2 p-4">
        <AIQuestionSpeaker question={questions[currentQuestionIndex]} />
      </div>
      <div className="right-side w-1/2 p-4">
        {!isInterviewComplete ? (
          <Card className="max-w-md text-center">
            <CardHeader>
              <CardTitle>Interview</CardTitle>
            </CardHeader>
            <CardContent>
              <UserCamera isCameraOn={true} onRecordEnd={handleNextQuestion} />
              <textarea
                value={userFeedback}
                onChange={(e) => setUserFeedback(e.target.value)}
                placeholder="How do you feel about your answer?"
                className="mt-4 w-full p-2 border border-gray-300 rounded"
              />
              <Button
                className="mt-4"
                onClick={handleNextQuestion}
                disabled={!userFeedback} // Ensure feedback is provided before moving on
              >
                Next Question
              </Button>
              <Progress
                className="mt-10"
                value={currentQuestionIndex + 1}
                total={questions.length}
              >
                Progress{'defewg '}
              </Progress>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center">
            <T.Subtle>Interview Completed!</T.Subtle>
            //Graded by the AI
            <T.Subtle className="text-2xl mt-4">AI Score: 90%</T.Subtle>
          </div>
        )}
      </div>
    </div>
  );
}