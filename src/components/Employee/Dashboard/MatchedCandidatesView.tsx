'use client';

import { TopThreeCandidatesBarChart } from '@/app/(dynamic-pages)/(authenticated-pages)/(user-pages)/employer/[organizationId]/(specific-organization-pages)/_graphs/TopThreeCandidatesBarChart';
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
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

import type { CandidateRow } from '@/types';
import { FireIcon } from '@heroicons/react/solid';
import { TrophyIcon } from 'lucide-react';

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

  function handleViewProfile(candidateId: string) {
    router.push(`/candidate/${candidateId}`);
  }

  function handleContact(candidateId: string) {
    router.push(`/messages?candidateId=${candidateId}`);
  }

  function getCandidateInterviewAvg(candidate: CandidateRow): number {
    const { interview_skill_stats } = candidate;
    if (!interview_skill_stats || interview_skill_stats.length === 0) {
      return 0;
    }
    return (
      interview_skill_stats.reduce(
        (acc, skillObj) => acc + skillObj.avg_score,
        0,
      ) / interview_skill_stats.length
    );
  }

  const topThreeBarData = topThree.map((cand) => ({
    name: cand.full_name,
    score: getCandidateInterviewAvg(cand),
  }));

  return (
    <>
      {/* Skill Gap */}
      {skillGapMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-red-400 shadow-lg">
            <CardHeader>
              <CardTitle className="text-red-500">
                Skill Gaps Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-600">{skillGapMessage}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        {/* Leaderboard (Top 3) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-md border rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrophyIcon className="text-yellow-300 h-6 w-6 mr-2" />{' '}
                Leaderboard (Top 3)
              </CardTitle>
              <CardDescription>
                Highest interview scores among matched candidates
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
                      <motion.div
                        key={cand.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center justify-between bg-muted/50 p-3 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-primary">
                            #{idx + 1}
                          </span>
                          <Avatar className="h-10 w-10">
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
                                  Score {candidateAvg.toFixed(1)}/100
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Aggregated interview score.</p>
                              </TooltipContent>
                            </Tooltip>
                            {percentiles[cand.id] && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({percentiles[cand.id].toFixed(1)}%ile)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-center space-y-2 *:gap-1">
                          <Button
                            variant="outline"
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
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Prospect */}
        {topProspect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="shadow-md border rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FireIcon className="text-orange-500 h-6 w-6 mr-2" />
                  Top Prospect
                </CardTitle>{' '}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={topProspect.avatar_url}
                      alt={topProspect.full_name}
                    />
                    <AvatarFallback>
                      {topProspect.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-lg">
                      {topProspect.full_name}
                    </p>
                    <Badge variant="secondary">
                      Score {getCandidateInterviewAvg(topProspect).toFixed(1)}
                      /100
                    </Badge>
                    {percentiles[topProspect.id] && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({percentiles[topProspect.id].toFixed(1)}%ile)
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
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
          </motion.div>
        )}

        {/* Full List Graph */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <TopThreeCandidatesBarChart topCandidates={topThreeBarData} />
        </motion.div>
      </div>
    </>
  );
}
