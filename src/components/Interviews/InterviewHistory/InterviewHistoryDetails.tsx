'use client';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  getInterviewById,
  getInterviewEvaluation,
} from '@/data/user/interviews';
import { Interview, InterviewEvaluation } from '@/types';
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

  const { title, status, start_time, end_time } = interview;

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
          <strong>Status:</strong> {status}
        </p>
        <p>
          <strong>Started At:</strong> {formattedStartedAt}
        </p>
        <p>
          <strong>Completed At:</strong> {formattedCompletedAt}
        </p>
      </div>

      {status === 'completed' && evaluation && (
        <div className="mt-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Interview Feedback</h2>
          <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
            <p>
              <strong>Overall Score:</strong> {evaluation.overall_score}
            </p>
            <p>
              <strong>Strengths:</strong> {evaluation.strengths}
            </p>
            <p>
              <strong>Areas for Improvement:</strong>{' '}
              {evaluation.areas_for_improvement}
            </p>
            <p>
              <strong>Recommendations:</strong> {evaluation.recommendations}
            </p>

            <h3 className="text-lg font-semibold mt-4">Evaluation Scores</h3>
            <ul className="list-disc list-inside">
              {Object.entries(evaluation.evaluation_scores).map(
                ([criterionId, score]) => (
                  <li key={criterionId} className="mb-2">
                    <strong>{score.name}</strong>: Score {score.score}
                    <br />
                    <span className="italic">Feedback: {score.feedback}</span>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewHistoryDetails;
