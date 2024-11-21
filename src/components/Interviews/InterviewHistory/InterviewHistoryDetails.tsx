'use client';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getInterviewById,
  getInterviewEvaluation,
} from '@/data/user/interviews';
import {
  EvaluationScores,
  Interview,
  InterviewEvaluation,
  QuestionAnswerFeedback
} from '@/types';
import { useEffect, useState } from 'react';

export const InterviewHistoryDetails = ({
  interviewId,
}: {
  interviewId: string;
}) => {
  const [interview, setInterview] = useState<Interview | null>(null);
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInterviewDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const interview = await getInterviewById(interviewId);
      const interviewEvaluation = await getInterviewEvaluation(interviewId);

      setInterview(interview);
      if (interviewEvaluation) {
        setEvaluation(interviewEvaluation);
      }
    } catch (error) {
      console.error('Error fetching interview details:', error);
      setError('Failed to fetch interview details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (interviewId) {
      fetchInterviewDetails();
    }
  }, [interviewId]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-center p-4">{error}</div>;
  }

  if (!interview) {
    return <div className="text-center p-4">No interview data available.</div>;
  }

  if (interview.status === 'not_started') {
    return (
      <div className="text-center p-4">Interview has not started yet.</div>
    );
  }

  const { title, status, start_time, end_time } = interview;

  const formattedStatus = status === 'completed' ? 'Completed' : 'In Progress';

  const formattedStartedAt = start_time
    ? new Date(start_time).toLocaleString()
    : 'N/A';
  const formattedCompletedAt = end_time
    ? new Date(end_time).toLocaleString()
    : 'N/A';

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <div className="mb-4">
        <p>
          <strong>Status:</strong> {formattedStatus}
        </p>
        <p>
          <strong>Started At:</strong> {formattedStartedAt}
        </p>
        <p>
          <strong>Completed At:</strong> {formattedCompletedAt}
        </p>
      </div>

      {status === 'completed' && evaluation && (
        <div className="w-full max-w-4xl mx-auto p-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Interview Feedback: {interview.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Overall Score */}
              <div className="text-center">
                <section className="mb-6">
                  <h2 className="text-xl font-semibold">Overall Grade</h2>
                  <p className="text-3xl font-bold text-blue-600">
                    {evaluation.overall_score}/100
                  </p>
                </section>

                {/* Strengths */}
                <section className="mb-6">
                  <h3 className="text-lg font-semibold">Strengths</h3>
                  <p>{evaluation.strengths}</p>
                </section>

                {/* Areas for Improvement */}
                <section className="mb-6">
                  <h3 className="text-lg font-semibold">
                    Areas for Improvement
                  </h3>
                  <p>{evaluation.areas_for_improvement}</p>
                </section>

                {/* Recommendations */}
                <section className="mb-6">
                  <h3 className="text-lg font-semibold">Recommendations</h3>
                  <p>{evaluation.recommendations}</p>
                </section>

                {/* Evaluation Scores */}
                <section className="mb-6">
                  <h3 className="text-lg font-semibold">Evaluation Scores</h3>
                  <ul className="list-disc list-inside">
                    {evaluation.evaluation_scores.map(
                      (score: EvaluationScores) => (
                        <li key={score.id} className="mb-2">
                          <strong>{score.name}</strong>: {score.score}/10
                          <br />
                          <span className="italic">
                            Feedback: {score.feedback}
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                </section>
              </div>

              {/* Question Answer Feedback */}
              {evaluation.question_answer_feedback &&
                evaluation.question_answer_feedback.length > 0 && (
                  <section className="mb-6">
                    <h3 className="text-lg font-semibold text-center mb-2">
                     Answer Feedback
                    </h3>
                    <div className="space-y-4">
                      {evaluation.question_answer_feedback.map(
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
                              {100 / evaluation.question_answer_feedback.length}
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
      )}
    </div>
  );
};

export default InterviewHistoryDetails;
