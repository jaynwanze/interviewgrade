'use client';

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { ClipboardCheck, Lock, Unlock, Mail, PhoneCall, Star } from 'lucide-react';

type PerformanceStats = {
  interviewsCompleted: number;
  highestSkill: string;
  averageScore: number;
};

// Mock data (example)
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
};

export default function CandidateDetailsPage() {
  const [candidate, setCandidate] = useState(mockCandidate);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // For demonstration, say the employer has 2 tokens left
  const [tokensLeft, setTokensLeft] = useState(2);

  function handleUnlock() {
    if (tokensLeft < 1) {
      setError('You do not have enough tokens to unlock contact info.');
      return;
    }
    // In real code: call your server action or API to spend tokens
    // and record an unlock in e.g. employee_candidate_unlocks
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
            <CardDescription className="flex justify-center items-center gap-2 mt-1">
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
              Candidate’s interview metrics (AI-based or real interviews)
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

      {/* Employer’s Private Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Your Private Notes</CardTitle>
          <CardDescription>
            Only visible to your organization.
          </CardDescription>
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
