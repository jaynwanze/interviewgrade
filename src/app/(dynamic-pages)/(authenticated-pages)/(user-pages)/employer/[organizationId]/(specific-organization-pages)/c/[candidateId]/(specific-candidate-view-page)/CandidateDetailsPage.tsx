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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Lock, Unlock, ClipboardCheck, Mail } from 'lucide-react';

// Mock data (example)
const mockCandidate = {
  id: 'c1',
  name: 'Alice Anderson',
  location: 'United States',
  avatarUrl: '/images/mock_avatar_f_1.jpg',
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
  },
};

export default function CandidateDetailsPage() {
  // We'll keep the candidate in state just to simulate lock/unlock changes
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
    // In real code: call your server action or API to spend 1 token,
    // and record an unlock in employee_candidate_unlocks, etc.

    setTokensLeft((prev) => prev - 1);
    setCandidate((prev) => ({ ...prev, isUnlocked: true }));
    setError('');
  }

  // CTA Example: “Invite to Interview”
  function handleInviteToInterview() {
    alert(`Inviting ${candidate.name} to an interview...`);
  }

  // CTA Example: “Request More Info”
  function handleRequestMoreInfo() {
    alert(`Requesting more info from ${candidate.name}...`);
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-6">
      {/* Header / Basic Info */}
      <Card>
        <CardHeader className="flex items-center gap-3">
          <Avatar>
            {candidate.avatarUrl ? (
              <AvatarImage src={candidate.avatarUrl} alt={candidate.name} />
            ) : (
              <AvatarFallback>
                {candidate.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <CardTitle className="text-lg">{candidate.name}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Badge variant="secondary">{candidate.location}</Badge>
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
        </CardHeader>
        <CardContent>
          {!candidate.isUnlocked ? (
            <div className="space-y-2">
              <p className="text-sm">
                Contact info is locked. Spend 1 token to unlock?
              </p>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button onClick={handleUnlock}>
                <Lock className="mr-2 h-4 w-4" />
                Unlock (Tokens Left: {tokensLeft})
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{candidate.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Unlock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{candidate.phone}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Stats (optional) */}
      {candidate.performanceStats && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>
              Stats from candidate’s completed interviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
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
                <Badge variant="outline">
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

      {/* Employer’s Private Notes (optional) */}
      <Card>
        <CardHeader>
          <CardTitle>Your Private Notes</CardTitle>
          <CardDescription>
            Only visible to you (organization).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Write your notes here..."
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
        <CardContent className="flex gap-2">
          <Button onClick={handleInviteToInterview}>
            Invite to Interview
          </Button>
          <Button variant="outline" onClick={handleRequestMoreInfo}>
            Request More Info
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
