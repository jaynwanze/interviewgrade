'use client';

import { Loader2, PlusCircle, Send, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const SUGGESTED_QUESTIONS = [
  'Why did I get this score?',
  'How can I improve my answers?',
  'Show me a stronger structure.',
  'What should I practise next?',
] as const;

export function PracticeCoachCard({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [followUpError, setFollowUpError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [creatingFollowUp, setCreatingFollowUp] = useState(false);

  async function askCoach(nextQuestion: string) {
    const normalized = nextQuestion.trim();
    if (normalized.length < 3 || loading) return;

    setQuestion(normalized);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v2/practice-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, question: normalized }),
      });
      const result = (await response.json()) as {
        answer?: string;
        error?: string;
        remaining?: number;
      };

      if (!response.ok || !result.answer) {
        throw new Error(result.error ?? 'AI Coach could not answer right now.');
      }

      setAnswer(result.answer);
      setRemaining(typeof result.remaining === 'number' ? result.remaining : null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'AI Coach could not answer right now.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function createFollowUpPractice() {
    if (creatingFollowUp) return;

    setCreatingFollowUp(true);
    setFollowUpError(null);

    try {
      const response = await fetch('/api/v2/practice-follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const result = (await response.json()) as {
        practiceId?: string;
        error?: string;
      };

      if (!response.ok || !result.practiceId) {
        throw new Error(
          result.error ?? 'A follow-up Practice could not be created right now.',
        );
      }

      router.push(
        `/candidate/practices/${result.practiceId}?generated=1&followup=1`,
      );
    } catch (cause) {
      setFollowUpError(
        cause instanceof Error
          ? cause.message
          : 'A follow-up Practice could not be created right now.',
      );
      setCreatingFollowUp(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void askCoach(question);
  }

  return (
    <Card className="border-primary/15 shadow-sm">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Ask about your feedback</CardTitle>
            <CardDescription className="mt-1.5 leading-6">
              AI Coach uses this completed Practice and its saved evaluation. It can
              explain the feedback or suggest improvements, but it cannot change your
              score.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => void askCoach(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>

        <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={500}
            placeholder="Ask one short question about this report…"
            aria-label="Ask AI Coach"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || question.trim().length < 3}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Ask Coach
          </Button>
        </form>

        {answer && (
          <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <div>
              <div className="text-sm font-medium">Coach</div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {answer}
              </p>
            </div>

            <div className="border-t pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={creatingFollowUp}
                onClick={() => void createFollowUpPractice()}
              >
                {creatingFollowUp ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="mr-2 h-4 w-4" />
                )}
                {creatingFollowUp
                  ? 'Creating follow-up…'
                  : 'Create a follow-up Practice'}
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Uses your saved report to create a fresh editable Practice and counts
                as one AI-created Practice.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {followUpError && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
            {followUpError}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Coach questions are intentionally limited while this feature is in its first
          release{remaining != null ? ` · ${remaining} remaining for this result` : ''}.
        </p>
      </CardContent>
    </Card>
  );
}
