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

import type { CandidateRow, EmployerPreferences } from '@/types';
import { FireIcon } from '@heroicons/react/solid';
import { PlaneTakeoffIcon, TrophyIcon } from 'lucide-react';

export function MatchedCandidatesView({
  skillGapMessage,
  topThree,
  topProspect,
  top3Worldwide,
  matched,
  mode,
  employersPrefs,
}: {
  skillGapMessage: string;
  topThree: CandidateRow[] | null;
  topProspect: CandidateRow | null;
  top3Worldwide: CandidateRow[] | null;
  matched: CandidateRow[];
  mode: string;
  employersPrefs: EmployerPreferences;
}) {
  const router = useRouter();

  function handleViewProfile(candidateId: string) {
    router.push(`/candidate/${candidateId}`);
  }

  function handleContact(candidateId: string) {
    router.push(`/messages?candidateId=${candidateId}`);
  }

  function getCandidateScoreAvgBySkill(
    candidate: CandidateRow,
    skill: string,
  ): number {
    const { interview_skill_stats, practice_skill_stats } = candidate;
    const stats =
      mode === 'interview' ? interview_skill_stats : practice_skill_stats;
    if (!stats || stats.length === 0) {
      return 0;
    }
    const skillStats = stats.find((s) => s.skill === skill);
    return skillStats ? skillStats.avg_score : 0;
  }

  const topThreeBarData = topThree?.map((cand) => ({
    name: cand.full_name,
    score: getCandidateScoreAvgBySkill(cand, employersPrefs.skill),
  }));

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="shadow-md border rounded-xl ">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className=" flex items-center gap-2">
              <PlaneTakeoffIcon className="h-6 w-6" /> Top Candidates Worldwide
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!top3Worldwide || top3Worldwide.length ===0 ? (
              <p>No matches found.</p>
            ) : (
              <>
                <div className="flex justify-around items-center">
                  {top3Worldwide.map((cand, idx) => {
                    const candidateAvg = getCandidateScoreAvgBySkill(
                      cand,
                      employersPrefs.skill,
                    );
                    return (
                      <motion.div
                        key={cand.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.15 }}
                        className="flex flex-col items-center space-y-2"
                      >
                        <div className="relative">
                          <Avatar className="h-16 w-16">
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
                          <Badge
                            variant="secondary"
                            className="absolute -bottom-1 -right-1 text-xs rounded-full px-2 py-0.5"
                          >
                            {candidateAvg.toFixed(0)}
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold">
                          {cand.full_name.split(' ')[0]}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/candidate/${cand.id}`)}
                        >
                          View
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

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
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
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
                Leaderboard
              </CardTitle>
              <CardDescription>
                Highest current average scores among matched candidates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!topThree || topThree.length === 0 ? (
                <p>No matches found.</p>
              ) : (
                <div className="space-y-3">
                  {topThree.map((cand, idx) => {
                    const candidateAvg = getCandidateScoreAvgBySkill(
                      cand,
                      employersPrefs.skill,
                    );
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
                                <p>
                                  Aggregated current score based off employer
                                  preferences.
                                </p>
                              </TooltipContent>
                            </Tooltip>
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-md border rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FireIcon className="text-orange-500 h-6 w-6 mr-2" />
                Top Prospect
              </CardTitle>{' '}
            </CardHeader>
            {!topProspect ? (
              <div className="p-4">
                <p>No matches found.</p>
              </div>
            ) : (
              <>
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
                        Score{' '}
                        {getCandidateScoreAvgBySkill(
                          topProspect,
                          employersPrefs.skill,
                        ).toFixed(1)}
                        /100
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {topProspect.summary}
                  </p>
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
              </>
            )}
          </Card>
        </motion.div>

        {/* Full List Graph */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="md:col-span-3 lg:col-span-1"
        >
          <TopThreeCandidatesBarChart topCandidates={topThreeBarData} />
        </motion.div>
      </div>
    </>
  );
}
