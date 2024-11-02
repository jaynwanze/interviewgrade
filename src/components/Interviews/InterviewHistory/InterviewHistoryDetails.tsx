'use client';
import { Interview, InterviewEvaluation } from '@/types';
import axios from 'axios';
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
      const response = await axios.get(`/api/interviews/${interviewId}`);
      const data: Interview & { evaluation?: InterviewEvaluation } =
        response.data;
      setInterview(data);
      if (data.evaluation) {
        setEvaluation(data.evaluation);
      }
    } catch (err: any) {
      console.error(
        'Error fetching interview details:',
        err.response?.data?.error || err.message,
      );
      setError(
        err.response?.data?.error || 'Failed to fetch interview details',
      );
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
    return <div className="text-center p-4">Loading interview details...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>;
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
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Interview Feedback</h2>
          <div className="bg-gray-100 p-4 rounded-lg">
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
