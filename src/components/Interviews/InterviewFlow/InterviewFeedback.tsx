'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InterviewEvaulation, EvaluationScores } from '@/types';
import { FC } from 'react';

interface InterviewFeedbackProps {
  interviewTitle: string;
  feedback: InterviewEvaulation | null;
}

export const InterviewFeedback: FC<InterviewFeedbackProps> = ({
  interviewTitle,
  feedback,
}) => {
  if (!feedback) {
    return <div>Feedback not available</div>;
  }

  return (
    <div className="text-center p-4">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Interview Feedback: {interviewTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <section className="mb-4">
            <h2 className="text-xl font-semibold">Overall Score</h2>
            <p className="text-lg">{feedback.overall_score}</p>
          </section>

          <section className="mb-4">
            <h3 className="text-lg font-semibold">Strengths</h3>
            <p>{feedback.strengths}</p>
          </section>

          <section className="mb-4">
            <h3 className="text-lg font-semibold">Areas for Improvement</h3>
            <p>{feedback.areas_for_improvement}</p>
          </section>

          <section className="mb-4">
            <h3 className="text-lg font-semibold">Recommendations</h3>
            <p>{feedback.recommendations}</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold">Evaluation Scores</h3>
            <ul className="list-disc list-inside">
              {feedback.evaluation_scores.map((score: EvaluationScores) => (
                <li key={score.name} className="mb-2">
                  <strong>{score.name}</strong>: Score {score.score}
                  <br />
                  <span className="italic">Feedback: {score.feedback}</span>
                </li>
              ))}
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};
