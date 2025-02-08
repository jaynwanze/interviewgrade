'use client';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from '@/types';
import { INTERVIEW_PRACTICE_MODE } from '@/utils/constants';
import { getInterviewFeedback } from '@/utils/openai/getInterviewFeedback';
import { CalendarIcon, ChevronLeft, ClockIcon } from 'lucide-react';
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
  
  const renderCoach = (evaluation: InterviewEvaluation) => {
    return (
      <div className="interview-flow-container flex flex-col items-center">
        Coach
      </div>
    );
  };

  const renderDetailed = (evaluation: InterviewEvaluation) => {
    if (!evaluation.question_answer_feedback?.length) {
      return (
        <div className="flex justify-center items-center p-6 text-gray-600">
          No detailed feedback available.
        </div>
      );
    }

    return (
      <div className="w-full max-w-4xl mx-auto space-y-4">
        {evaluation.question_answer_feedback.map((qa, index) => (
          <Card key={index} className="shadow-sm border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Question {index + 1}
              </CardTitle>
              <p className="text-sm text-gray-500">{qa.question}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* User's Answer */}
              <div className="text-gray-700">
                <span className="font-semibold">Your Response:</span>{' '}
                <span className="text-gray-900">{qa.answer || 'N/A'}</span>
              </div>

              {/* Feedback Analysis */}
              <div>
                <span className="font-semibold">AI Analysis:</span>
                <p className="text-sm text-gray-600">{qa.feedback}</p>
              </div>

              <Separator className="my-3" />

              {/* Score */}
              <div className="flex items-center justify-between">
                <span className="font-semibold">Score:</span>
                <Badge
                  className={`text-white ${qa.mark >=
                      80 /
                      Math.floor(
                        100 / evaluation.question_answer_feedback.length,
                      )
                      ? 'bg-green-600'
                      : qa.mark >=
                        60 /
                        Math.floor(
                          100 / evaluation.question_answer_feedback.length,
                        )
                        ? 'bg-yellow-500'
                        : qa.mark >=
                          40 /
                          Math.floor(
                            100 / evaluation.question_answer_feedback.length,
                          )
                          ? 'bg-orange-500'
                        : 'bg-red-500'
                    }`}
                >
                  {qa.mark}/
                  {Math.floor(100 / evaluation.question_answer_feedback.length)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderOverview = (evaluation: InterviewEvaluation) => {
    const getScoreColor = (score: number) => {
      return score >= 80
        ? 'bg-green-600'
        : score >= 60
        ? 'bg-orange-500'
        : score >= 40
        ? 'bg-yellow-500'
        : 'bg-red-500';
    };
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Overall Score */}
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Overall Score</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-lg font-semibold">Performance:</span>
          <Badge
            className={`text-white text-lg px-4 py-2 ${getScoreColor(evaluation.overall_grade)}`}
          >
            {evaluation.overall_grade}/100
          </Badge>
        </CardContent>
        <Separator />

        {/* Strengths */}
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Strengths</CardTitle>
        </CardHeader>
        <CardContent className="text-gray-700">
          {evaluation.strengths
            ? evaluation.strengths
            : 'No strengths identified.'}
        </CardContent>
        <Separator />

        {/* Areas for Improvement */}
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Areas for Improvement
          </CardTitle>
        </CardHeader>
        <CardContent className="text-gray-700">
          {evaluation.areas_for_improvement
            ? evaluation.areas_for_improvement
            : 'No areas identified.'}
        </CardContent>
        <Separator/>

        {/* Recommendations */}
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="text-gray-700">
          {evaluation.recommendations
            ? evaluation.recommendations
            : 'No recommendations provided.'}
        </CardContent>
        <Separator />

        {/* Radial Chart (To Be Added) */}
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Skill Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">[Insert Radial Chart Here]</p>
        </CardContent>
        <Separator />

        {/* Evaluation Scores Table */}
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Evaluation Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="w-full border rounded-sm">
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-gray-900/5 font-bold">
                <TableHead className="text-left px-4 py-2 border">
                  Criterion
                </TableHead>
                <TableHead className="text-center px-4 py-2 border">
                  Score
                </TableHead>
                <TableHead className="text-left px-4 py-2 border">
                  Feedback
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluation.evaluation_scores.map((score) => (
                <TableRow key={score.id} className="border-b">
                  <TableCell className="px-4 py-2 font-semibold">
                    {score.name || 'N/A'}
                  </TableCell>
                  <TableCell className="px-4 py-2 text-center">
                    <Badge
                      className={`text-white ${getScoreColor(score.score * 10)}`}
                    >
                      {score.score}/10
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-2 text-gray-600">
                    {score.feedback}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </div>
    );
  };
  return (
    <div className="p-2 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        {/* Back Button */}
        <button
          className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800"
          onClick={() => window.history.back()}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        {/* Interview Details */}
        <div className="flex-1 text-left space-y-2">
          <div className="flex items-center space-x-2">
            <Badge className="bg-black dark:bg-slate-600 text-white text-sm px-3 py-1">
              AI
            </Badge>
            <h1 className="text-3xl font-bold">Interview Report</h1>
          </div>
          <p className="text-lg text-gray-600">{interview.title}</p>

          {/* Meta Info Row */}
          <div className="flex items-center space-x-4 text-gray-500">
            <div className="flex items-center space-x-1">
              <CalendarIcon className="h-5 w-5" />
              <span>{new Date(interview.start_time).toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <ClockIcon className="h-5 w-5" />
              <span>{interview.duration} mins</span>
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Tabs Section */}
      {interview.status === 'completed' && evaluation ? (
        <Tabs defaultValue="overview" className="p-5">
          <TabsList className="grid grid-cols-3 w-full mx-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Detailed</TabsTrigger>
            <TabsTrigger value="coach">AI Interview Coach</TabsTrigger>
          </TabsList>

          <div className="shadow-lg mt-5 p-6 rounded-lg border">
            <TabsContent value="overview">
              {renderOverview(evaluation)}
            </TabsContent>
            <TabsContent value="details">
              {renderDetailed(evaluation)}
            </TabsContent>
            <TabsContent value="coach">{renderCoach(evaluation)}</TabsContent>
          </div>
        </Tabs>
      ) : (
        <div className="text-center p-4">
          No interview feedback available yet.
        </div>
      )}
    </div>
  );
};

export default InterviewHistoryDetails;
