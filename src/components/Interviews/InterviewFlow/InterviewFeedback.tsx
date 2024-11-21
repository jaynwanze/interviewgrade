'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  EvaluationScores,
  FeedbackData,
  QuestionAnswerFeedback,
} from '@/types';
import { FC } from 'react';

interface InterviewFeedbackProps {
  interviewTitle: string;
  feedback: FeedbackData | null;
}

export const InterviewFeedback: FC<InterviewFeedbackProps> = ({
  interviewTitle,
  feedback,
}) => {
  if (!feedback) {
    return <div className="text-center p-4">Feedback not available</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Interview Feedback: {interviewTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Overall Score */}
          <div className="text-center">
            <section className="mb-6">
              <h2 className="text-xl font-semibold">Overall Grade</h2>
              <p className="text-3xl font-bold text-blue-600">
                {feedback.overall_score}/100
              </p>
            </section>

            {/* Strengths */}
            <section className="mb-6">
              <h3 className="text-lg font-semibold">Strengths</h3>
              <p>{feedback.strengths}</p>
            </section>

            {/* Areas for Improvement */}
            <section className="mb-6">
              <h3 className="text-lg font-semibold">Areas for Improvement</h3>
              <p>{feedback.areas_for_improvement}</p>
            </section>

            {/* Recommendations */}
            <section className="mb-6">
              <h3 className="text-lg font-semibold">Recommendations</h3>
              <p>{feedback.recommendations}</p>
            </section>

            {/* Evaluation Scores */}
            <section className="mb-6">
              <h3 className="text-lg font-semibold">Evaluation Scores</h3>
              <ul className="list-disc list-inside">
                {feedback.evaluation_scores.map((score: EvaluationScores) => (
                  <li key={score.id} className="mb-2">
                    <strong>{score.name}</strong>: {score.score}/10
                    <br />
                    <span className="italic">Feedback: {score.feedback}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Question Answer Feedback */}
          {feedback.question_answer_feedback &&
            feedback.question_answer_feedback.length > 0 && (
              <section className="mb-6">
                <h3 className="text-lg font-semibold text-center mb-2">
                  Answer Feedback
                </h3>
                <div className="space-y-4">
                  {feedback.question_answer_feedback.map(
                    (qa: QuestionAnswerFeedback, index: number) => (
                      <div
                        key={index}
                        className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800"
                      >
                        <h4 className="text-md font-semibold mb-2">
                          Question {index + 1}: {qa.question}
                        </h4>
                        <p className="mb-2">
                          <strong>Answer:</strong> {qa.answer}
                        </p>
                        <p className="mb-2">
                          <strong>Mark:</strong> {qa.score}/
                          {100 / feedback.question_answer_feedback.length}
                        </p>
                        <p>
                          <strong>Feedback:</strong> {qa.feedback}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </section>
            )}
        </CardContent>
      </Card>
    </div>
  );
};
