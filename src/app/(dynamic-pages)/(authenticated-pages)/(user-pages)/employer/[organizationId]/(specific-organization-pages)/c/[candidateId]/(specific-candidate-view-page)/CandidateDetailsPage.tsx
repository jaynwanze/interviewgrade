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
import { Textarea } from '@/components/ui/textarea';
import {
  ClipboardCheck,
  Lock,
  Mail,
  PhoneCall,
  Star
} from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText } from 'lucide-react';

// Optional: If you want to show a small “Recent Attempts” or “Timeline”:

type RecentAttempt = {
  type: 'practice' | 'interview';
  date: string;
  skillFocus: string;
  score: number;
  id: string;
};

type PerformanceStats = {
  interviewsCompleted: number;
  highestSkill: string;
  averageScore: number;
};

const mockCandidate = {
  id: 'c1',
  full_name: 'Alice Anderson',
  country: 'United States',
  avatar_url: '/images/mock_avatar_f_1.jpg',
  topSkills: ['Communication', 'Teamwork', 'Problem Solving'],
  isUnlocked: false,
  email: 'alice@example.com',
  phone: '(555) 123-4567',
  summary:
    "I'm a passionate software engineer with a strong background in problem-solving and communication. Ready to tackle new challenges!",
  performanceStats: {
    interviewsCompleted: 3,
    highestSkill: 'Problem Solving',
    averageScore: 88,
  } as PerformanceStats,
  // OPTIONAL: If you have a real CV URL from your storage or external link:
  resumeUrl: 'https://example.com/mock-cv.pdf', // pretend PDF link for demo
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
  ] as RecentAttempt[],
};

export default function CandidateDetailsPage() {
  const [candidate, setCandidate] = useState(mockCandidate);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  // For demonstration, say the employer has 2 tokens left
  const [tokensLeft, setTokensLeft] = useState(2);
  // For opening the resume in a dialog
  const [openResumeDialog, setOpenResumeDialog] = useState(false);

  function handleUnlock() {
    if (tokensLeft < 1) {
      setError('You do not have enough tokens to unlock contact info.');
      return;
    }
    // Real code: call server action / API to spend token & record unlock
    setTokensLeft((prev) => prev - 1);
    setCandidate((prev) => ({ ...prev, isUnlocked: true }));
    setError('');
  }

  function handleInviteToInterview() {
    alert(`Inviting ${candidate.full_name} to an interview... (mock)`);
  }

  function handleRequestMoreInfo() {
    alert(`Requesting more info from ${candidate.full_name}... (mock)`);
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-6">
      {/* Header / Basic Info */}
      <Card>
        <CardHeader className="flex items-center gap-3">
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
            <CardTitle className="text-lg">{candidate.full_name}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{candidate.country}</Badge>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">{candidate.summary}</p>
          <div className="flex gap-2 flex-wrap">
            {candidate.topSkills.map((skill) => (
              <Badge key={skill} variant="outline">
                {skill}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Details</CardTitle>
          <CardDescription>
            {candidate.isUnlocked
              ? 'You have unlocked this candidate’s contact info.'
              : 'Spend 1 token to unlock their contact info.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!candidate.isUnlocked ? (
            <div className="space-y-2">
              <p className="text-sm">
                <Lock className="inline-block mr-1 h-4 w-4 text-muted-foreground" />
                Contact info is locked.
              </p>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button onClick={handleUnlock} variant="default">
                <Lock className="mr-2 h-4 w-4" />
                Unlock (Tokens Left: {tokensLeft})
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{candidate.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{candidate.phone}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Stats */}
      {candidate.performanceStats && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>
              Candidate’s recent interview or practice metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-sm text-muted-foreground">
                  Interviews Completed
                </p>
                <span className="text-xl font-bold">
                  {candidate.performanceStats.interviewsCompleted}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Highest Skill</p>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  {candidate.performanceStats.highestSkill}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Score</p>
                <span className="text-xl font-bold">
                  {candidate.performanceStats.averageScore}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optional: Recent Attempts (Practice/Interviews) */}
      {candidate.recentAttempts && candidate.recentAttempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Attempts</CardTitle>
            <CardDescription>
              A quick glance at this candidate’s latest attempts
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
                    {new Date(attempt.date).toLocaleString()} &mdash; Focus on{' '}
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
      )}

      {/* Resume / CV link */}
      <Card>
        <CardHeader>
          <CardTitle>Resume / CV</CardTitle>
          <CardDescription>
            If provided, you can view their most recent CV below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {candidate.resumeUrl ? (
            <>
              <p className="text-sm text-muted-foreground">
                Preview or download candidate’s resume.
              </p>
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
                      Here is the CV or PDF the candidate uploaded.
                    </DialogDescription>
                  </DialogHeader>

                  {/* We can embed PDF in an iframe, or do whatever you like */}
                  <div className="w-full h-[600px] mt-4 overflow-auto bg-muted">
                    <iframe
                      src={candidate.resumeUrl}
                      title="Candidate CV"
                      className="w-full h-full"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <p className="text-sm">No resume provided.</p>
          )}
        </CardContent>
      </Card>

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

      {/* CTA Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          <Button onClick={handleInviteToInterview}>Invite to Interview</Button>
          <Button variant="outline" onClick={handleRequestMoreInfo}>
            Request More Info
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
