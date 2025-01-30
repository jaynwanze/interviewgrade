'use client';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getInterviewAnswers,
  getInterviewById,
  getInterviewEvaluation,
  getInterviewQuestions,
} from '@/data/user/interviews';
import {
  FeedbackData,
  Interview,
  InterviewAnswerDetail,
  InterviewEvaluation,
  QuestionAnswerFeedback,
} from '@/types';
import { INTERVIEW_PRACTICE_MODE } from '@/utils/constants';
import { getInterviewFeedback } from '@/utils/openai/getInterviewFeedback';
import { useEffect, useRef, useState } from 'react';

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
  const [isFetchingFeedback, setIsFetchingFeedback] = useState<boolean>(false);
  const [gradeStringColour, setGradeStringColour] = useState<string>('');
  const hasFetched = useRef(false);

  const retryFeedbackFetch = async (interview: Interview) => {
    setIsFetchingFeedback(true);
    // Ensure synchronization between questions and answers
    const questions = await getInterviewQuestions(interviewId);
    const answers = await getInterviewAnswers(
      questions.map((question) => question.id),
    );

    if (questions.length !== answers.length) {
      console.error('Mismatch between questions and answers.');
      setIsFetchingFeedback(false);
      return;
    }

    const interviewAnswersDetails: InterviewAnswerDetail[] = questions.map(
      (question, index) => ({
        question: question.text,
        answer: answers[index].text,
        mark: answers[index].mark,
        feedback: answers[index].feedback,
        evaluation_criteria_name: question.evaluation_criteria.name,
      }),
    );

    try {
      const feedback: FeedbackData | null = await getInterviewFeedback(
        interview,
        interview.evaluation_criterias,
        interviewAnswersDetails,
      );
      if (feedback) {
        const interviewEvaluation = await getInterviewEvaluation(interviewId);
        setEvaluation(interviewEvaluation);
      }
    } catch (error) {
      console.error('Error fetching interview feedback:', error);
      setIsFetchingFeedback(false);
    } finally {
      setIsFetchingFeedback(false);
    }
  };

  const fetchInterviewDetails = async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    setLoading(true);
    setError(null);
    try {
      const interview = await getInterviewById(interviewId);
      if (!interview) {
        setError('Session not found');
        return;
      }
      setInterview(interview);
      const interviewEvaluation = await getInterviewEvaluation(interviewId);
      if (interviewEvaluation) {
        setEvaluation(interviewEvaluation);
      } else {
        retryFeedbackFetch(interview);
      }
    } catch (error) {
      console.error('Error fetching session details:', error);
      setError('Failed to fetch session details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (interviewId) {
      fetchInterviewDetails();
    }
  }, [interviewId]);

  useEffect(() => {
    if (evaluation) {
      const grade = evaluation.overall_grade;
      if (grade >= 80) {
        setGradeStringColour('text-green-600');
      } else if (grade >= 60) {
        setGradeStringColour('text-yellow-600');
      } else {
        setGradeStringColour('text-red-600');
      }
    }
  }, [evaluation]);

  if (loading) {
    return (
      <div className="flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isFetchingFeedback) {
    return (
      <div className="text-center p-4">
        <span>Fetching interview feedback...</span>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <div className="text-center p-4">{error}</div>;
  }

  if (!interview) {
    return <div className="text-center p-4">No session is data available.</div>;
  }

  if (interview.status === 'not_started') {
    return <div className="text-center p-4">Session has not started yet.</div>;
  }

  const { title, mode, status, start_time, end_time } = interview;

  const interviewModeDisplayString =
    mode === INTERVIEW_PRACTICE_MODE ? 'Practice Session' : 'Interview Session';

  const formattedStatus = status === 'completed' ? 'Completed' : 'In Progress';

  const formattedStartedAt = start_time
    ? new Date(start_time).toLocaleString()
    : 'N/A';
  const formattedCompletedAt = end_time
    ? new Date(end_time).toLocaleString()
    : 'N/A';

  return (
    <>
      <div className="p-4 max-w-3xl mx-auto text-center">
        <div className="w-full max-w-4xl mx-auto p-4">
          <Card className="shadow-lg p-4">
            <h1 className="text-2xl font-bold mb-1">
              {' '}
              {interviewModeDisplayString}: {title}
            </h1>
            <p>
              <strong>Status:</strong> {formattedStatus}
            </p>
            <p>
              <strong>Started At:</strong> {formattedStartedAt}
            </p>
            <p>
              <strong>Completed At:</strong> {formattedCompletedAt}
            </p>
          </Card>
        </div>
      </div>

      {(status === 'completed' && evaluation && (
        <div className="interview-flow-container flex flex-col items-center min-h-screen">
          <div className="left-side w-3/4 p-4 flex flex-col items-center justify-center text-center">
            <Card className="shadow-lg">
              <CardHeader className="bg-gray-100 dark:bg-gray-800 text-2xl font-bold mb-4">
                Report
              </CardHeader>
              <CardContent>
                {/* Overall Score */}
                <section className="mb-2">
                  <h2 className="text-xl font-semibold">Overall Grade</h2>
                  <p className={`text-3xl font-bold ${gradeStringColour}`}>
                    {evaluation.overall_grade}/100
                  </p>
                </section>

                {/* Strengths */}
                <section className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Strengths</h2>
                  <p>
                    {evaluation.strengths
                      ? evaluation.strengths
                      : 'None Provided'}
                  </p>
                </section>

                {/* Areas for Improvement */}
                <section className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">
                    Areas for Improvement
                  </h2>
                  <p>
                    {evaluation.areas_for_improvement
                      ? evaluation.areas_for_improvement
                      : 'None Provided'}
                  </p>
                </section>

                {/* Recommendations */}
                <section className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">
                    Recommendations
                  </h2>
                  <p>
                    {evaluation.recommendations
                      ? evaluation.recommendations
                      : 'None Provided'}
                  </p>
                </section>

                {/* Evaluation Scores */}
                <section className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">
                    Evaluation Scores
                  </h2>
                  <table className="min-w-full border">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800 font-bold">
                        <th className="px-4 py-2 border">Criterion</th>
                        <th className="px-4 py-2 border">Score</th>
                        <th className="px-4 py-2 border">Feedback</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluation.evaluation_scores.map((score) => (
                        <tr key={score.id}>
                          <td className="px-4 py-2 border bold font-semibold">
                            {score.name || 'N/A'}
                          </td>
                          <td className="px-4 py-2 border font-semibold">
                            {score.score}/10
                          </td>
                          <td className="px-4 py-2 border italic">
                            {score.feedback}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              </CardContent>
            </Card>
          </div>

          {/* Question Answer Feedback */}
          {evaluation.question_answer_feedback &&
            evaluation.question_answer_feedback.length > 0 && (
              <div className="right-side w-3/4 p-4 flex flex-col justify-center">
                <Card className="shadow-lg">
                  <CardHeader className="bg-gray-100 dark:bg-gray-800 text-2xl font-bold mb-4 text-center">
                    Answer Feedback
                  </CardHeader>
                  <section className="mb-6">
                    {evaluation.question_answer_feedback.map(
                      (qa: QuestionAnswerFeedback, index: number) => (
                        <div
                          key={index}
                          className="p-4 mx-5 mb-4 border rounded-lg bg-gray-50 dark:bg-gray-800"
                        >
                          <h4 className="text-md font-semibold mb-2">
                            Question {index + 1}: {qa.question}
                          </h4>
                          <p className="mb-2">
                            <strong>Answer:</strong> {qa.answer || 'N/A'}
                          </p>
                          <p className="mb-2">
                            <strong>Mark:</strong> {qa.mark}/
                            {(
                              100 / evaluation.question_answer_feedback.length
                            ).toFixed(2)}
                          </p>
                          <p>
                            <strong>Feedback:</strong> {qa.feedback}
                          </p>
                        </div>
                      ),
                    )}
                  </section>
                </Card>
              </div>
            )}
        </div>
      )) || (
          <div className="p-4 max-w-3xl mx-auto text-center">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">
                  Interview Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-1">No feedback available yet.</div>
              </CardContent>
            </Card>
          </div>
        )}
    </>
  );
};

export default InterviewHistoryDetails;
