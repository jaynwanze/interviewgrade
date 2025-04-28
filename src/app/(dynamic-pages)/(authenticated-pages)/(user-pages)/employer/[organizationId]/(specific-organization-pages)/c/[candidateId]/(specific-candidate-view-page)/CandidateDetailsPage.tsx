'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { ResumeHighlights } from '@/components/Employee/CandidateDetailedView/ResumeHighlights';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getCandidateById, unlockCandidateAction } from '@/data/user/employee';
import { useToastMutation } from '@/hooks/useToastMutation';
import { useTokens } from '@/hooks/useTokens';
import { CandidateDetailsView } from '@/types';
import { Linkedin, Lock, Mail, Star } from 'lucide-react';

export default function CandidateDetailsPage({
  candidateId,
}: {
  candidateId: string;
}) {
  const [candidate, setCandidate] = useState<CandidateDetailsView | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Example performance toggle for "Interview" vs. "Practice"
  const [performanceMode, setPerformanceMode] = useState<
    'interview' | 'practice'
  >('practice');

  // For viewing the CV in a dialog
  const [openResumeDialog, setOpenResumeDialog] = useState(false);

  const { data: tokens, isLoading, isError } = useTokens();

  useEffect(() => {
    const fetchCandidate = async () => {
      setLoading(true);
      try {
        const data = await getCandidateById(candidateId);
        if (!data) {
          setError('Candidate not found.');
          return;
        }
        setCandidate(data);
      } catch (error) {
        setError('Failed to fetch candidate details.');
      } finally {
        setLoading(false);
      }
    };

    if (candidateId) {
      fetchCandidate();
    }
  }, [candidateId]);

  function handleEmailCandidate() {
    // Instead of showing the email directly, we open the user's email client.
    window.open(`mailto:${candidate?.email}`, '_blank');
  }
  // Helper function to determine badge color based on score.
  const getBadgeColor = (score: number): string => {
    if (score >= 70) return 'bg-green-500 text-white'; // 70% - 100%
    if (score >= 60) return 'bg-lime-500 text-white'; // 60% - 69%
    if (score >= 50) return 'bg-yellow-500 text-white'; // 50% - 59%
    if (score >= 40) return 'bg-orange-500 text-white'; // 40% - 49%
    return 'bg-red-500 text-white'; // 0%  - 39%
  };

  const handleUnlockCandidate = () => {
    // if (!checkTokens()) return;
    unlockCandidateMutation.mutate();
  };

  const checkTokens = () => {
    if (!tokens) {
      setError('Failed to fetch token balance. Refresh and try again.');
      return false;
    }
    if ((tokens?.tokens_available ?? 0) < 2) {
      setError('Not enough tokens to unlock. Please purchase more tokens.');
      //change to pop up dialog
      return false;
    }
    return true;
  };

  const unlockCandidateMutation = useToastMutation(
    async () => {
      return await unlockCandidateAction(candidateId);
    },
    {
      loadingMessage: 'Unlocking candidate...',
      errorMessage: 'Failed to unlock candidate',
      successMessage: 'Candidate unlocked!',
      onSuccess: () => {
        window.location.reload();
      },
    },
  );

  function getShortName(fullName: string): string {
    if (!fullName) return '';

    // Split by spaces, ignoring empty strings
    const parts = fullName.split(' ').filter(Boolean);

    // If there's only one name part (e.g. "Cher" or "Madonna"), just return that
    if (parts.length === 1) {
      return parts[0];
    }

    // Otherwise, use the first part in full + the first letter of the *last* part
    const firstName = parts[0];
    const lastName = parts[parts.length - 1]; // handle middle names gracefully
    return `${firstName} ${lastName.charAt(0).toUpperCase()}.`;
  }

  // Compute best skill among either interview_skill_stats or practice_skill_stats
  function getBestSkill(
    cand: CandidateDetailsView,
    mode: 'interview' | 'practice',
  ) {
    const stats =
      mode === 'interview'
        ? cand.interview_skill_stats
        : cand.practice_skill_stats;
    if (!stats || stats.length === 0) return { skill: 'N/A', avg_score: 0 };

    // Find the skill with the highest average score
    const bestSkill = stats.reduce((best, s) =>
      s.avg_score > best.avg_score ? s : best,
    );
    return bestSkill;
  }

  // Compute "average" across whichever skill array
  function getOverallSkillsAverageScore(
    cand: CandidateDetailsView,
    mode: 'interview' | 'practice',
  ) {
    const stats =
      mode === 'interview'
        ? cand.interview_skill_stats
        : cand.practice_skill_stats;
    if (!stats || stats.length === 0) return 0;
    const sum = stats.reduce((acc, s) => acc + s.avg_score, 0);
    return Math.round(sum / stats.length);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex justify-center items-center h-64 min-h-screen">
        <p className="text-lg text-muted-foreground">Candidate not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-6">
      {/* Basic candidate info */}
      <Card>
        <CardHeader className="flex justify-center items-center gap-3">
          <Avatar>
            <AvatarImage src={candidate.avatar_url} alt={candidate.full_name} />
            <AvatarFallback>
              {candidate.full_name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="flex justify-center items-center text-lg">
              {candidate.isUnlocked
                ? candidate.full_name
                : getShortName(candidate.full_name)}
            </CardTitle>
            <span className="flex justify-center items-center gap-2 mt-1">
              <Badge variant="secondary">{candidate.country}</Badge>
            </span>
            <div className="flex gap-4 mt-2">
              {getBestSkill(candidate, 'practice').skill !== 'N/A' && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    <strong>Top Practice Skill</strong>
                  </p>
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 mt-1"
                  >
                    <Star className="h-4 w-4 text-yellow-500" />
                    {getBestSkill(candidate, 'practice').skill}
                  </Badge>
                </div>
              )}
              {getBestSkill(candidate, 'interview').skill !== 'N/A' && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    <strong>Top Interview Skill</strong>
                  </p>
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 mt-1"
                  >
                    <Star className="h-4 w-4 text-yellow-500" />
                    {getBestSkill(candidate, 'interview').skill}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">{candidate.summary}</p>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">{candidate.role}</Badge>
            <Badge variant="outline">{candidate.industry}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Contact / Details Card */}
      {!candidate.isUnlocked ? (
        <Card>
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
            <CardDescription>
              Spend 1 tokens to unlock deeper info and access to this contact
              candidate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              <Lock className="inline-block w-4 h-4 mr-1" />
              Unlock access to potential hire to get in touch.
            </p>
            <div className="flex items-center justify-center mt-4">
              <Button
                onClick={() => {
                  handleUnlockCandidate();
                }}
                variant="default"
              >
                <Lock className="mr-2 h-4 w-4" />
                Unlock Candidate (Tokens left: {tokens?.tokens_available ?? 0})
              </Button>
            </div>
            <div className="relative mt-4">
              <motion.div
                initial={{ filter: 'blur(6px)', opacity: 0.7 }}
                animate={{ filter: 'blur(6px)', opacity: 0.7 }}
                transition={{ duration: 0.5 }}
                className="p-3 bg-muted rounded"
              >
                <p className="text-sm mt-2">
                  <strong>Email:</strong> hidden@***.com
                </p>
                <p className="text-sm mt-1">
                  <strong>Phone:</strong> ***-***-****
                </p>
                <div className="mt-2">
                  <p className="text-sm">
                    <strong>Interviews Completed:</strong> ??
                  </p>
                  <p className="text-sm">
                    <strong>Highest Skill:</strong> ??
                  </p>
                  <p className="text-sm">
                    <strong>Avg Score:</strong> ??
                  </p>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Contact Candidate</CardTitle>
              <CardDescription>
                Directly email the candidate to get in touch.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button onClick={handleEmailCandidate} variant="default">
                  <Mail className="mr-2 h-4 w-4" />
                  Email Candidate
                </Button>
                {candidate.linkedin_url && (
                  <a
                    href={candidate.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded inline-flex items-center">
                      <Linkedin className="mr-2 h-4 w-4" />
                      Linkedin Profile
                    </Button>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resume Highlights */}
          <ResumeHighlights candidate={candidate} />
        </>
      )}

      {/* Performance Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>
            Toggle between “Interview” or “Practice” mode stats.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tabs for interview vs. practice */}
          <Tabs
            defaultValue="practice"
            onValueChange={(val) =>
              setPerformanceMode(val as 'interview' | 'practice')
            }
          >
            <TabsList className="grid grid-cols-2 w-full mb-3">
              <TabsTrigger value="practice">Practice Statistics</TabsTrigger>
              <TabsTrigger value="interview">Interview Statistics</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-6">
            <div>
              <p className="text-sm text-muted-foreground">
                <strong>Best Skill</strong>
              </p>
              <Badge variant="outline" className="flex items-center gap-1 mt-1">
                <Star className="h-4 w-4 text-yellow-500" />
                {getBestSkill(candidate, performanceMode).skill}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                <strong>Current Avg Score</strong>
              </p>
              <span className="text-xl font-bold">
                {getBestSkill(candidate, performanceMode).avg_score.toFixed(1)}%
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                <strong>Current Avg Score Across All Skills</strong>
              </p>
              <span className="text-xl font-bold">
                {getOverallSkillsAverageScore(
                  candidate,
                  performanceMode,
                ).toFixed(1)}
                %
              </span>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Skill</TableHead>
                <TableHead>Average Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(performanceMode === 'interview'
                ? candidate.interview_skill_stats
                : candidate.practice_skill_stats) !== null ? (
                (performanceMode === 'interview'
                  ? candidate.interview_skill_stats
                  : candidate.practice_skill_stats
                ).map((stat) => (
                  <TableRow key={stat.template_id}>
                    <TableCell>{stat.skill}</TableCell>
                    <TableCell>
                      <Badge
                        className={`px-4 py-2 m-2 text-md ${getBadgeColor(stat.avg_score)}`}
                      >
                        {stat.avg_score.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Attempts (optional) */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Recent Attempts</CardTitle>
          <CardDescription>
            Candidate’s latest practice or interviews
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {candidate.recentAttempts && candidate.recentAttempts.length > 0 ? (
            <>
              {candidate.recentAttempts.map((attempt) => (
                <div
                  key={attempt.interview_id}
                  className="flex items-center justify-between bg-muted p-2 rounded"
                >
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {attempt.interview_mode} attempt
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(attempt.date).toLocaleString()} — Focus on{' '}
                      {attempt.skillFocus}
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {attempt.score}%
                  </div>
                </div>
              ))}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No recent attempts found.
            </p>
          )}
        </CardContent>
      </Card> */}

      {/* Employer’s Private Notes */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Your Private Notes</CardTitle>
          <CardDescription>Only visible to your organization.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Write any private notes here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </CardContent>
        <CardFooter>
          <Button variant="secondary">
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Save Notes
          </Button>
        </CardFooter>
      </Card> */}
    </div>
  );
}
