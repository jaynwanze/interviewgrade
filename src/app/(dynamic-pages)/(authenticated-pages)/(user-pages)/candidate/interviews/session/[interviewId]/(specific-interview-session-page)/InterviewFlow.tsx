'use client';
import { AIQuestionSpeaker } from '@/components/Interviews/AIQuestionSpeaker';
import { InterviewFeedback } from '@/components/Interviews/InterviewFeedback';
import { UserCamera } from '@/components/Interviews/UserCamera';
import { T } from '@/components/ui/Typography';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InterviewEvaulation } from '@/types';
import { getInterviewFeedback } from '@/utils/openai/getInterviewFeedback';
import { useCallback, useEffect, useRef, useState } from 'react';

// InterviewFlow component
export default function InterviewFlow() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [isQuestionsComplete, setIsQuestionsComplete] = useState(false);
  const [answersLength, setAnswersLength] = useState(0);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const answers = useRef<string[]>([]);
  const [interviewFeedback, setInterviewFeedback] =
    useState<InterviewEvaulation | null>(null);
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);

  const interviewTitle = 'Behavioral Interview';

  const questions = [
    'How do you approach problems?',
    'Can you describe a time when you faced a challenge?',
    'How do you prioritize your tasks?',
  ];

  const evaluationCriteria = [
    {
      id: 'criteria_uuid_1',
      name: 'Communication Skills',
      description: 'Ability to convey ideas clearly and effectively.',
    },
    {
      id: 'criteria_uuid_2',
      name: 'Problem-Solving Ability',
      description:
        'Skill in analyzing situations and developing effective solutions.',
    },
    {
      id: 'criteria_uuid_3',
      name: 'Adaptability',
      description:
        'Capacity to adjust to new conditions and environments with ease.',
    },
  ];

  // Callback function to get answer from after each recording
  const handleAnswer = useCallback((answer: string) => {
    answers.current.push(answer);
    setAnswersLength(answers.current.length); // Update state with the new length
  }, []);

  // Function to move to the next question
  const handleNextQuestion = () => {
    // Save response to the current question
    // Increment current question index
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsQuestionsComplete(true); // Mark questions as complete
    }
  };

  // Effect to handle completion of the interview when questions are done
  useEffect(() => {
    if (isQuestionsComplete && answersLength === questions.length) {
      handleSaveInterviewState(); // Save the interview state
    }
  }, [isQuestionsComplete, answersLength]); // Dependencies to trigger effect when questions are complete

  const handleSaveInterviewState = async () => {
    // Implement logic to save interview state
    // You could call an API to save the state here
    setIsFetchingFeedback(true);
    console.log('Fetching feedback for the interview...');
    try {
      const feedback: InterviewEvaulation = await getInterviewFeedback(
        interviewTitle, // Interview title
        questions,
        answers.current,
        evaluationCriteria,
      );

      console.log('Feedback received:', feedback); // Log feedback for debugging
      setInterviewFeedback(feedback);
      setIsInterviewComplete(true); // Mark the interview as complete
      setIsCameraOn(false); // Turn off the camera when interview is complete
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setIsFetchingFeedback(false);
    }
  };

  const getInterviewState = () => { };

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
                  answerCallback={handleAnswer}
                  isCameraOn={true}
                  onRecordEnd={handleNextQuestion}
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
          {interviewFeedback ? (
            <InterviewFeedback
              interviewTitle={interviewTitle}
              feedback={interviewFeedback}
            />
          ) : (
            <p>Loading feedback...</p>
          )}
        </div>
      )}
    </div>
  );
}
