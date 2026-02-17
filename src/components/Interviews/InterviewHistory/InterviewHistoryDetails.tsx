'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CalendarIcon, ChevronLeft, ClockIcon, FileDown, Lock, Crown } from 'lucide-react';
import { getCurrentCandidateSubscription } from '@/data/user/candidate';
import { Button } from '@/components/Button';
import { ProBadge, UpgradePrompt, LockedFeature } from '@/components/ProFeatureGateDialog';
import { ChatInterface } from '@/components/Interviews/InterviewHistory/InterviewHistoryChatInterface';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  SENTIMENT_DETAILS,
  SentimentDetails,
  getDynamicDescription,
} from '@/components/SentimentDisplay';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getInterviewAnswers,
  getInterviewById,
  getInterviewEvaluation,
  getInterviewQuestions,
} from '@/data/user/interviews';
import { Interview, InterviewAnswerDetail, InterviewEvaluation } from '@/types';
import { isPro, FREE_LIMITS } from '@/utils/checkAccess';
import { RadarChartEvaluationsCriteriaScores } from './RadarChartEvaluationsCriteriaScores';

export type SentimentScore = {
  label: string;
  score: number;
  aggregated_scores?: Record<string, number>;
};

export async function fetchSentiment(
  answers: string[],
  attempt = 1,
): Promise<SentimentScore | null> {

  try {
    const inputText = answers.join('\n').trim();
    if (!inputText) {
      return null;
    }

    const res = await fetch('/api/sentiment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: inputText }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `HTTP error! Status: ${res.status} - ${errorText}. URL: ${res.url}`,
      );
    }

    const data = await res.json();
    const scores = Array.isArray(data[0])
      ? (data[0] as SentimentScore[])
      : (data as SentimentScore[]);

    if (scores.length === 0) throw new Error('Empty sentiment result');
    const sorted = scores.sort((a, b) => b.score - a.score);
    let predicted_label = sorted[0].label;
    if (predicted_label.startsWith('LABEL_')) {
      const id = parseInt(predicted_label.split('_')[1], 10);
      predicted_label =
        id === 0 ? 'negative' : id === 1 ? 'neutral' : 'positive';
    }
    const finalScore = sorted[0].score * 100;
    return { label: predicted_label, score: finalScore, aggregated_scores: {} };
  } catch (error) {
    console.error('Error fetching sentiment:', error);

    if (attempt === 1) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return fetchSentiment(answers, 2);
    }

    return null;
  }
}

export const InterviewHistoryDetails = ({
  interviewId,
}: {
  interviewId: string;
}) => {
  const [interview, setInterview] = useState<Interview | null>(null);
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  const [sentimentDetails, setSentimentDetails] = useState<SentimentDetails | null>(null);
  const [dynamicDescription, setDynamicDescription] = useState<string | null>(null);
  const [sentimentScore, setSentimentScore] = useState<SentimentScore | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('overview');
  const [isFetchingFeedback, setIsFetchingFeedback] = useState<boolean>(false);
  const hasFetched = useRef(false);
  const [isProUser, setProUser] = useState<boolean>(false);
  const [showPdfUpgrade, setShowPdfUpgrade] = useState(false);
  const [showCoachUpgrade, setShowCoachUpgrade] = useState(false);

  useEffect(() => {
    const checkProStatus = async () => {
      try {
        const subscription = await getCurrentCandidateSubscription();
        const proStatus = isPro(subscription);
        setProUser(proStatus);
      } catch (error) {
        setProUser(false);
      }
    };
    checkProStatus();
  }, []);

  const retryFeedbackFetch = async (interview: Interview) => {
    setIsFetchingFeedback(true);
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
      const res = await fetch('/api/interview/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interview,
          criteria: interview.evaluation_criterias ?? [],
          answers: interviewAnswersDetails,
        }),
      });

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      const interviewEvaluation = await getInterviewEvaluation(interviewId);
      setEvaluation(interviewEvaluation);
    } catch (error) {
      console.error('Error fetching interview feedback:', error);
    } finally {
      setIsFetchingFeedback(false);
    }
  };

  const fetchInterviewDetails = useCallback(async () => {
    if (hasFetched.current || !interviewId) return;
    hasFetched.current = true;
    setLoading(true);
    setError(null);

    try {
      const [interview, interviewEvaluation] = await Promise.all([
        getInterviewById(interviewId),
        getInterviewEvaluation(interviewId),
      ]);

      if (!interview) {
        setError('Session not found');
        return;
      }

      setInterview(interview);
      if (interviewEvaluation) {
        setEvaluation(interviewEvaluation);
      } else {
        retryFeedbackFetch(interview);
      }
    } catch (error) {
      console.error('Error fetching interview:', error);
      setError('Failed to fetch interview details');
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    if (evaluation && evaluation.question_answer_feedback) {
      const candidateAnswers = evaluation.question_answer_feedback.map(
        (qa) => qa.answer,
      );
      // fetchSentiment(candidateAnswers).then((data) => {
      //   if (data) return setSentimentScore(data);
      //   return null;
      // });
    }
  }, [evaluation]);

  useEffect(() => {
    if (interviewId) {
      fetchInterviewDetails();
    }
  }, [interviewId, fetchInterviewDetails]);

  const getScoreColor = (score: number): string => {
    if (score >= 70) return 'bg-green-500 text-white';
    if (score >= 60) return 'bg-lime-500 text-white';
    if (score >= 50) return 'bg-yellow-500 text-white';
    if (score >= 40) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };

  const handleCoachTabClick = () => {
    if (!isProUser) {
      setShowCoachUpgrade(true);
      return;
    }
    setSelectedTab('coach');
  };

  const generatePDF = () => {
    if (!isProUser) {
      setShowPdfUpgrade(true);
      return;
    }

    if (!interview || !evaluation) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Interview Report', 14, 22);
    doc.setFontSize(12);
    doc.text(`Title: ${interview.title}`, 14, 32);
    doc.text(
      `Date: ${new Date(interview.start_time).toLocaleString()}`,
      14,
      42,
    );
    doc.text(`Duration: ${interview.duration} mins`, 14, 52);
    autoTable(doc, {
      startY: 62,
      head: [['Criteria', 'Score', 'Feedback']],
      body: evaluation.evaluation_scores.map((score) => [
        score.name || 'N/A',
        `${score.score}/10`,
        score.feedback,
      ]),
    });
    doc.save('interview_report.pdf');
  };
const renderCoach = (evaluationData: InterviewEvaluation) => {
    if (!isProUser) {
      return (
        <div className="relative p-6 border rounded-lg mt-5">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center z-10">
            <Lock className="h-8 w-8 text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">AI Coach</h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs mb-4">
              Get personalized advice and ask questions about your interview performance
            </p>
            <Button
              onClick={() => setShowCoachUpgrade(true)}
              className="bg-gradient-to-r from-yellow-500 to-orange-500"
            >
              <Crown className="mr-2 h-4 w-4" />
              Unlock AI Coach
            </Button>
          </div>

          <div className="blur-sm pointer-events-none">
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">How can I improve my communication score?</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <p className="text-sm">Based on your interview, here are 3 specific ways...</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-4xl mx-auto mt-5">
        <ChatInterface interview={interview!} evaluation={evaluationData} />
      </div>
    );
  };

  if (error) {
    return <div className="text-center p-4">{error}</div>;
  }
 if (loading) {
    return <LoadingSpinner />;
  }

  if (!interview) {
    return <div className="text-center p-4">No session data available.</div>;
  }

  if (interview.status === 'not_started') {
    return <div className="text-center p-4">Session has not started yet.</div>;
  }

  const renderDetailed = (evaluation: InterviewEvaluation) => {
    if (!evaluation.question_answer_feedback?.length) {
      return (
        <div className="flex justify-center items-center p-6 text-gray-600">
          No detailed feedback available.
        </div>
      );
    }
    return (
      <div className="shadow-lg mt-5 p-6 rounded-lg border">
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
                <div className="text-gray-700">
                  <span className="font-semibold">Your Response:</span>{' '}
                  <span className="text-gray-900">{qa.answer || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold">AI Analysis:</span>
                  <p className="text-sm text-gray-600">{qa.feedback}</p>
                </div>
                <Separator className="my-3" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Score:</span>
                  <Badge className="text-white bg-green-600">
                    {qa.mark}/
                    {Math.floor(100 / evaluation.question_answer_feedback.length)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderOverview = (evaluation: InterviewEvaluation) => {
    const rubricLimit = isProUser ? Infinity : FREE_LIMITS.rubricCriteriaShown;
    return (
      <div className="shadow-lg mt-5 p-6 rounded-lg border">
        <div className="w-full max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between space-y-12">
            <span className="flex flex-col space-y-6">
              <CardTitle className="text-xl font-semibold">
                Overall Score
              </CardTitle>
              <span className="space-y-10 text-lg font-semibold">
                Performance:
              </span>
            </span>
            <Badge
              className={`text-white text-lg px-4 py-2 ${getScoreColor(evaluation.overall_grade)}`}
            >
              {Math.round(evaluation.overall_grade)}/100
            </Badge>
          </div>
          <Separator />
          {sentimentScore && dynamicDescription && sentimentDetails && (
            <>
              <div className="flex flex-col justify-between space-y-6">
                <span className="flex items-center gap-2">
                  <CardTitle className="text-xl font-semibold">
                    Answer Sentiment Snapshot
                  </CardTitle>
                  {/* <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-gray-500 dark:text-gray-400 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          This sentiment analysis snapshot offers an{' '}
                          <strong>initial look</strong> at the candidate’s
                          answer tone for this session based off{' '}
                          <strong>one data point</strong> (candidate answers).
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider> */}
                </span>
                <span className="text-gray-700">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{sentimentDetails.icon}</span>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {sentimentScore.label.toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {dynamicDescription}
                      </p>
                    </div>
                  </div>
                </span>
                <div className="mt-4 h-3 w-full bg-gray-300 rounded-full">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: `${sentimentScore.score}%` }}
                    transition={{ duration: 1 }}
                    className={`h-full ${sentimentDetails.color} rounded-full`}
                  />
                </div>
              </div>
              <Separator />
            </>
          )}
          <div className="flex flex-col justify-between space-y-6">
            <CardTitle className="text-xl font-semibold">Strengths</CardTitle>
            <span className="text-gray-700">
              {evaluation.strengths || 'No strengths identified.'}
            </span>
          </div>
          <Separator />
          <div className="flex flex-col justify-between space-y-6">
            <CardTitle className="text-xl font-semibold">
              Areas for Improvement
            </CardTitle>
            <span className="text-gray-700">
              {evaluation.areas_for_improvement || 'No areas identified.'}
            </span>
          </div>
          <Separator />
          <div className="flex flex-col justify-between space-y-6">
            <CardTitle className="text-xl font-semibold">
              Recommendations
            </CardTitle>
            <span className="text-gray-700">
              {evaluation.recommendations || 'No recommendations provided.'}
            </span>
          </div>
          <Separator />
          <div className="flex flex-col justify-between space-y-6">
            <CardTitle className="text-xl font-semibold">
              Skill Breakdown
            </CardTitle>
            <span>
              {isProUser ? (
              <RadarChartEvaluationsCriteriaScores evaluation={evaluation} />
            ) : (
              LockedFeature
              // <LockedFeature
              //   feature="Skill Breakdown Chart"
              //   description="Visualize your performance across different skill areas with our radar chart."
              //   className="w-full h-64 flex items-center justify-center border rounded-lg"
              // />
            )}
            </span>
          </div>
          <Separator />
          <div className="flex flex-col justify-between space-y-6">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-semibold">
                Evaluation Scores
              </CardTitle>
              {!isProUser && <ProBadge />}
            </div>
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
                {evaluation.evaluation_scores.map((score, index) => {
                  const isLocked = index >= rubricLimit;
                  if (isLocked) {
                    return (
                      <TableRow key={score.id} className="border-b relative">
                        <TableCell
                          colSpan={3}
                          className="px-4 py-2 text-center"
                        >
                          <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Lock className="h-4 w-4" />
                            <span className="text-sm">
                              Upgrade to Pro to see all criteria
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return (
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
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {!isProUser && evaluation.evaluation_scores.length > rubricLimit && (
            <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-center">
                <span className="font-medium">
                  +{evaluation.evaluation_scores.length - rubricLimit} more
                  criteria hidden
                </span>
                <br />
                <span className="text-muted-foreground">
                  Upgrade to Pro to see your complete breakdown
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };


  return (
    <div className="p-2 max-w-5xl mx-auto">
      {interview.status === 'completed' && evaluation ? (
        <>
          <div className="flex flex-col md:flex-row items-start justify-between gap-4 w-full">
            <button
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800"
              onClick={() => window.history.back()}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <Button
              variant="outline"
              onClick={generatePDF}
              className={!isProUser ? 'opacity-75' : ''}
            >
              {isProUser ? (
                <>
                  <FileDown className="mr-2 h-4 w-4" />
                  Download PDF
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Download PDF
                  <ProBadge className="ml-2" />
                </>
              )}
            </Button>

            <div className="flex-1 text-left space-y-2">
              <div className="flex items-center space-x-2">
                <Badge className="bg-black dark:bg-slate-600 text-white text-sm px-3 py-1">
                  AI
                </Badge>
                <h1 className="text-2xl font-bold">
                  {interview.mode === 'practice'
                    ? 'Practice Session'
                    : 'Interview Session'}{' '}
                  Report
                </h1>
              </div>
              <p className="text-gray-600">{interview.title}</p>
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

            <Tabs
              defaultValue="overview"
              className="p-4"
              onValueChange={(value) => {
                if (value === 'coach') {
                  handleCoachTabClick();
                } else {
                  setSelectedTab(value);
                }
              }}
            >
              <TabsList
                className={`grid grid-cols-${interview.mode === 'interview' ? 3 : 2} w-full mx-auto`}
              >
                <TabsTrigger value="overview">Overview</TabsTrigger>
                {interview.mode === 'interview' && (
                  <TabsTrigger value="details">Detailed</TabsTrigger>
                )}
                <TabsTrigger value="coach" className="relative">
                  AI Interview Coach
                  {!isProUser && <ProBadge className="ml-1" />}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Separator className="my-4" />

          {selectedTab === 'overview' && renderOverview(evaluation)}
          {selectedTab === 'details' &&
            interview.mode === 'interview' &&
            renderDetailed(evaluation)}
          {selectedTab === 'coach' && renderCoach(evaluation)}
        </>
      ) : (
        <>
          <button
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="text-center p-4">
            No interview feedback available yet.
          </div>
        </>
      )}

      {/* Upgrade Prompts */}
      <UpgradePrompt
        open={showPdfUpgrade}
        onOpenChange={setShowPdfUpgrade}
        feature="PDF Reports"
        description="Download detailed interview reports to track your progress and share with mentors."
      />
      <UpgradePrompt
        open={showCoachUpgrade}
        onOpenChange={setShowCoachUpgrade}
        feature="AI Coach"
        description="Chat with your AI interview coach to get personalized improvement tips and ask follow-up questions about your performance."
      />
    </div>
  );
};

export default InterviewHistoryDetails;