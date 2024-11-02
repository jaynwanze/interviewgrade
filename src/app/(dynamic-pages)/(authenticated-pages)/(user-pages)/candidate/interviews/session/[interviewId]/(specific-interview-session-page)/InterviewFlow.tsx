'use client';
import { AIQuestionSpeaker } from '@/components/Interviews/InterviewFlow/AIQuestionSpeaker';
import { InterviewFeedback } from '@/components/Interviews/InterviewFlow/InterviewFeedback';
import { UserCamera } from '@/components/Interviews/InterviewFlow/UserCamera';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { T } from '@/components/ui/Typography';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getInterview,
  getInterviewQuestions,
  insertInterviewAnswer,
  insertInterviewEvaluation,
} from '@/data/user/interviews';
import {
  EvaluationCriteriaType,
  InterviewEvaulation,
  InterviewQuestion,
} from '@/types';
import { getInterviewFeedback } from '@/utils/openai/getInterviewFeedback';
import { useCallback, useEffect, useRef, useState } from 'react';

// InterviewFlow component
export default function InterviewFlow({
  interviewId,
}: {
  interviewId: string;
}) {
  /// State to manage the interview flow
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [isQuestionsComplete, setIsQuestionsComplete] = useState(false);
  const [answersLength, setAnswersLength] = useState(0);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const answers = useRef<string[]>([]);
  const [interviewFeedback, setInterviewFeedback] =
    useState<InterviewEvaulation | null>(null);
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);
  const [interviewTitle, setInterviewTitle] = useState<string>('');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [evaluationCriteria, setEvaluationCriteria] = useState<
    EvaluationCriteriaType[]
  >([]);

  //use mutation
  const fetchInterview = async () => {
    // Fetch interview details
    const interview = await getInterview(interviewId);
    if (!interview) {
      throw new Error('Interview not found');
    }
    const interviewTitle: string = interview.title;
    setInterviewTitle(interviewTitle);

    const interviewQuestions = await getInterviewQuestions(interviewId);
    if (!interviewQuestions || interviewQuestions.length === 0) {
      throw new Error('No questions found for this interview');
    }
    setQuestions(interviewQuestions);

    const evaluationCriteria = interview.evaluation_criteria ?? [];
    setEvaluationCriteria(evaluationCriteria);
  };

  const getInterviewState = () => { };

  // Fetch interview details when component mounts
  useEffect(() => {
    getInterviewState();
    fetchInterview();
  }, []);

  // Effect to handle completion of the interview when questions are done
  useEffect(() => {
    if (isQuestionsComplete && answersLength === questions.length) {
      handleSaveInterviewState(); // Save the interview state
    }
  }, [isQuestionsComplete, answersLength, questions.length]);

  // Callback function to get answer from after each recording
  const handleAnswer = useCallback(
    (answer: string) => {
      answers.current.push(answer);
      setAnswersLength(answers.current.length); // Update state with the new length
      insertInterviewAnswer(questions[currentQuestionIndex].id, answer);
    },
    [questions],
  );

  // Function to move to the next question
  const handleNextQuestion = useCallback(() => {
    setCurrentQuestionIndex((prevIndex) => {
      if (prevIndex < questions.length - 1) {
        return prevIndex + 1;
      } else {
        setIsQuestionsComplete(true); // Mark questions as complete
        return prevIndex;
      }
    });
  }, [questions.length]);

  const handleSaveInterviewState = async () => {
    // Implement logic to save interview state
    // You could call an API to save the state here
    setIsFetchingFeedback(true);
    const questionsText = questions.map((question) => question.text);
    console.log('Fetching feedback for the interview...');
    try {
      const feedback: InterviewEvaulation = await getInterviewFeedback(
        interviewTitle, // Interview title
        questionsText,
        answers.current,
        evaluationCriteria,
      );

      handleFeedback(feedback); // Handle the feedback
      setIsInterviewComplete(true); // Mark the interview as complete
      setIsCameraOn(false); // Turn off the camera when interview is complete
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setIsFetchingFeedback(false);
    }
  };

  const handleFeedback = useCallback(async (feedback: InterviewEvaulation) => {
    // Insert into database
    // TODO: Implement database insertion logic here

    // Set the interview feedback
    const response = await insertInterviewEvaluation(interviewId, feedback);
    setInterviewFeedback(feedback);
  }, []);

  return (
    <div className="interview-flow-container flex justify-center items-center min-h-screen">
      {!isInterviewComplete ? (
        <div className="flex w-full max-w-4xl">
          {questions[currentQuestionIndex] ? (
            <>
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
                    <Button
                      className="mt-4"
                      onClick={handleNextQuestion}
                      disabled={isFetchingFeedback}
                    >
                      Next Question
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <LoadingSpinner />
          )}
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
