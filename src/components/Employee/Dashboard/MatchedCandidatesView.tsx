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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { CandidateRow } from '@/types'; // your CandidateRow interface
import { useRouter } from 'next/navigation';

export function MatchedCandidatesView({
  skillGapMessage,
  topThree,
  percentiles,
  topProspect,
  matched,
}: {
  skillGapMessage: string;
  topThree: CandidateRow[];
  percentiles: { [id: string]: number };
  topProspect: CandidateRow | null;
  matched: CandidateRow[];
}) {
  const router = useRouter();

  function handleContact(candidateId: string) {
    alert(`Contacting candidate ${candidateId}... (mock)`);
  }

  function handleViewProfile(candidateId: string) {
    alert(`Viewing profile for candidate ${candidateId}... (mock)`);
  }

  // A helper function to compute the candidate's overall interview average from interview_skill_stats
  function getCandidateInterviewAvg(candidate: CandidateRow): number {
    const { interview_skill_stats } = candidate;
    if (!interview_skill_stats || interview_skill_stats.length === 0) {
      return 0;
    }
    const sum = interview_skill_stats.reduce(
      (acc, skillObj) => acc + skillObj.avg_score,
      0,
    );
    return sum / interview_skill_stats.length; // e.g. 88.5
  }

  return (
    <>
      {/* Skill Gap */}
      {skillGapMessage && (
        <Card className="border-red-400">
          <CardHeader>
            <CardTitle className="text-red-500">Skill Gaps Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600">{skillGapMessage}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Leaderboard (Top 3) */}
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard (Top 3)</CardTitle>
            <CardDescription>
              Highest overall interview averages among matched candidates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topThree.length === 0 ? (
              <p>No matches found.</p>
            ) : (
              <div className="space-y-3">
                {topThree.map((cand, idx) => {
                  const candidateAvg = getCandidateInterviewAvg(cand);
                  return (
                    <div
                      key={cand.id}
                      className="flex items-center justify-between bg-muted/50 p-2 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold">#{idx + 1}</span>
                        <Avatar>
                          {cand.avatar_url ? (
                            <AvatarImage
                              src={cand.avatar_url}
                              alt={cand.full_name}
                            />
                          ) : (
                            <AvatarFallback>
                              {cand.full_name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-medium">{cand.full_name}</p>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="secondary">
                                Score {candidateAvg.toFixed(1)}/100
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Candidate’s aggregated interview average.</p>
                            </TooltipContent>
                          </Tooltip>

                          {/* If you want to show percentile: */}
                          {percentiles[cand.id] && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({percentiles[cand.id].toFixed(1)}%ile)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => handleViewProfile(cand.id)}
                        >
                          View Profile
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleContact(cand.id)}
                        >
                          Contact
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Prospect */}
        {topProspect && (
          <Card>
            <CardHeader>
              <CardTitle>Top Prospect</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar>
                  {topProspect.avatar_url ? (
                    <AvatarImage
                      src={topProspect.avatar_url}
                      alt={topProspect.full_name}
                    />
                  ) : (
                    <AvatarFallback>
                      {topProspect.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="font-medium">{topProspect.full_name}</p>
                  <Badge variant="secondary">
                    Score {getCandidateInterviewAvg(topProspect).toFixed(1)}/100
                  </Badge>
                  {percentiles[topProspect.id] && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({percentiles[topProspect.id].toFixed(1)}
                      %ile)
                    </span>
                  )}
                </div>
              </div>
              Show more details here...
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                variant="link"
                size="sm"
                onClick={() => handleViewProfile(topProspect.id)}
              >
                View Profile
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleContact(topProspect.id)}
              >
                Contact
              </Button>
            </CardFooter>
          </Card>
        )}
        {/* Full List */}
        <Card>
          <CardHeader>
            <CardTitle>All Matched Candidates</CardTitle>
            <CardDescription>
              Full listing of everyone who meets your preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {matched.length === 0 ? (
              <p className="text-sm">No matches found.</p>
            ) : (
              matched.map((cand) => {
                const candidateAvg = getCandidateInterviewAvg(cand);
                return (
                  <div
                    key={cand.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                          <AvatarImage
                          src={cand.avatar_url}
                          alt={cand.full_name}
                        />
                        <AvatarFallback>
                          {cand.full_name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{cand.full_name}</p>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="secondary">
                              Score {candidateAvg.toFixed(1)}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Numeric rating out of 100.</p>
                          </TooltipContent>
                        </Tooltip>
                        {percentiles[cand.id] && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ~{percentiles[cand.id].toFixed(1)}%ile
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => handleViewProfile(cand.id)}
                      >
                        View
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleContact(cand.id)}
                      >
                        Contact
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
