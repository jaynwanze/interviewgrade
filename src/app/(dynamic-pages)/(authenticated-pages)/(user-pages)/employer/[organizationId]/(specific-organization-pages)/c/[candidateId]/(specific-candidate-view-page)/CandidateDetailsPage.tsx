'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { useState } from 'react';

import { CandidateSkillsStats } from '@/types';
import {
  ClipboardCheck,
  FileText,
  Lock,
  Mail,
  PhoneCall,
  Star,
} from 'lucide-react';

type RecentAttempt = {
  id: string;
  type: 'practice' | 'interview';
  date: string;
  skillFocus: string;
  score: number;
};

type CandidateDetailsView = {
  id: string;
  city: string;
  country: string;
  phone_number: string;
  summary: string;
  role: string;
  industry: string;
  practice_skill_stats: CandidateSkillsStats[];
  interview_skill_stats: CandidateSkillsStats[];
  created_at: string;
  full_name: string;
  avatar_url?: string;
  email: string;
  resumeUrl?: string;
  recentAttempts?: RecentAttempt[];
  isUnlocked?: boolean;
};
const mockCandidate: CandidateDetailsView = {
  id: 'c1',
  city: 'New York',
  country: 'United States',
  phone_number: '(555) 123-4567',
  summary: 'Enthusiastic engineer with strong communication skills.',
  role: 'Software Engineer',
  industry: 'Tech',
  practice_skill_stats: [
    { id: '1', skill: 'Problem Solving', avg_score: 92, previous_avg: 90 },
    { id: '2', skill: 'Communication', avg_score: 88, previous_avg: 85 },
    { id: '3', skill: 'Teamwork', avg_score: 90, previous_avg: 88 },
  ],
  interview_skill_stats: [
    { id: 'p1', skill: 'Behavioural', avg_score: 89, previous_avg: 87 },
  ],
  created_at: '2024-04-29T10:00:00Z',
  full_name: 'Alice Anderson',
  avatar_url:
    'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp',
  email: 'alice@example.com',
  resumeUrl: 'https://example.com/mock-cv.pdf', // Simulated CV link
  recentAttempts: [
    {
      id: 'attempt1',
      type: 'practice',
      date: '2024-05-02T10:30:00Z',
      skillFocus: 'Communication',
      score: 85,
    },
    {
      id: 'attempt2',
      type: 'interview',
      date: '2024-04-29T09:00:00Z',
      skillFocus: 'Problem Solving',
      score: 92,
    },
  ],
};

export default function CandidateDetailsPage() {
  const [candidate, setCandidate] =
    useState<CandidateDetailsView>(mockCandidate);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // e.g., the employer has 2 tokens left
  const [tokensLeft, setTokensLeft] = useState(2);
  // Example performance toggle for "Interview" vs. "Practice"
  const [performanceMode, setPerformanceMode] = useState<
    'interview' | 'practice'
  >('interview');

  // For viewing the CV in a dialog
  const [openResumeDialog, setOpenResumeDialog] = useState(false);

  function handleUnlock() {
    if (tokensLeft < 1) {
      setError('You do not have enough tokens to unlock contact info.');
      return;
    }
    // Real code: call server action or API to spend a token & mark as unlocked
    setTokensLeft((prev) => prev - 1);
    setCandidate((prev) => ({ ...prev, isUnlocked: true }));
    setError('');
  }

  function handleMessage() {
    alert(`Inviting ${candidate.full_name} to an message... (mock)`);
  }

  function handleRequestMoreInfo() {
    alert(`Requesting more info from ${candidate.full_name}... (mock)`);
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

    return stats.reduce((best, s) => {
      return s.avg_score > best.avg_score ? s : best;
    });
  }

  // Compute "average" across whichever skill array
  function getAverageScore(
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

  const bestSkillObj = getBestSkill(candidate, performanceMode);
  const averageScore = getAverageScore(candidate, performanceMode);

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
            <CardTitle className="flex justify-center items-center text-lg">{candidate.full_name}</CardTitle>
            <span className="flex justify-center items-center gap-2 mt-1">
              <Badge variant="secondary">{candidate.country}</Badge>
            </span>
            <div className="flex gap-4 mt-2">
              <div>
              <p className="text-sm text-muted-foreground">
                <strong>Top Practice Skill</strong>
              </p>
              <Badge variant="outline" className="flex items-center gap-1 mt-1">
                <Star className="h-4 w-4 text-yellow-500" />
                {getBestSkill(candidate, 'practice').skill}
              </Badge>
              </div>
              <div>
              <p className="text-sm text-muted-foreground">
                <strong>Top Interview Skill</strong>
              </p>
              <Badge variant="outline" className="flex items-center gap-1 mt-1">
                <Star className="h-4 w-4 text-yellow-500" />
                {getBestSkill(candidate, 'interview').skill}
              </Badge>
              </div>
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
      {!candidate.isUnlocked && (
        <Card>
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
            <CardDescription>
              Spend 1 token to unlock contact info + analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <>
              {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
              <p className="text-sm text-muted-foreground">
                <Lock className="inline-block w-4 h-4 mr-1 text-muted-foreground" />
                This candidate’s deeper info is hidden.
              </p>
              <div className="flex items-center justify-center mt-4">
                <Button onClick={handleUnlock} variant="default">
                  <Lock className="mr-2 h-4 w-4" />
                  Unlock Candidate (Tokens left: {tokensLeft})
                </Button>
              </div>
              {/* Blurred preview demonstration */}
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
            </>
          </CardContent>
        </Card>
      )}

      {/* If unlocked, show more analytics & CV */}
      {candidate.isUnlocked && (
        <>
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Details</CardTitle>
                <CardDescription>
                  You have unlocked this candidate’s contact info and stats.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

                <div className="gridspace-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{candidate.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PhoneCall className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{candidate.phone_number}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA Buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  What would you like to do next?
                </p>
              </CardContent>
              <CardContent className="flex gap-2 flex-wrap">
                <Button onClick={handleMessage}>Message</Button>
                <Button variant="outline" onClick={handleRequestMoreInfo}>
                  Request More Info
                </Button>
              </CardContent>
            </Card>
          </div>
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
                defaultValue="interview"
                onValueChange={(val) =>
                  setPerformanceMode(val as 'interview' | 'practice')
                }
              >
                <TabsList className="grid grid-cols-2 w-full mb-3">
                  <TabsTrigger value="interview">Interview Stats</TabsTrigger>
                  <TabsTrigger value="practice">Practice Stats</TabsTrigger>
                </TabsList>
                <TabsContent value="interview">
                  <div className="flex gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Best Skill</strong>
                      </p>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 mt-1"
                      >
                        <Star className="h-4 w-4 text-yellow-500" />
                        {getBestSkill(candidate, 'interview').skill}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Avg Score Across All Skills</strong>
                      </p>
                      <span className="text-xl font-bold">
                        {getAverageScore(candidate, 'interview')}%
                      </span>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="practice">
                  <div className="flex gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Best Skill</strong>
                      </p>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 mt-1"
                      >
                        <Star className="h-4 w-4 text-yellow-500" />
                        {getBestSkill(candidate, 'practice').skill}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Avg Score Across All Skills</strong>
                      </p>
                      <span className="text-xl font-bold">
                        {getBestSkill(candidate, 'practice').avg_score}%
                      </span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Recent Attempts (optional)
          {candidate.recentAttempts && candidate.recentAttempts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Attempts</CardTitle>
                <CardDescription>
                  Candidate’s latest practice or interviews
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {candidate.recentAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between bg-muted p-2 rounded"
                  >
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {attempt.type} attempt
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
              </CardContent>
            </Card>
          )} */}

          {/* Resume / CV link */}
          <Card>
            <CardHeader>
              <CardTitle>Resume / CV</CardTitle>
              <CardDescription>
                Preview or download candidate’s resume.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {candidate.resumeUrl ? (
                <Dialog
                  open={openResumeDialog}
                  onOpenChange={setOpenResumeDialog}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <FileText className="mr-2 h-4 w-4" />
                      View CV
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Candidate’s Resume</DialogTitle>
                      <DialogDescription>
                        The CV the candidate provided
                      </DialogDescription>
                    </DialogHeader>
                    <div className="w-full h-[500px] mt-4 overflow-auto bg-muted">
                      {/* Sample PDF embed in an iframe */}
                      <iframe
                        src={candidate.resumeUrl}
                        title="Candidate Resume"
                        className="w-full h-full"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <p className="text-sm">No resume provided.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Employer’s Private Notes */}
      <Card>
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
      </Card>
    </div>
  );
}
