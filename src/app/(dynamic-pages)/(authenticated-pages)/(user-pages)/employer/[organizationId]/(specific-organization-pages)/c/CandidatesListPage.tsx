'use client';

import { ChevronLeft, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  mockCandidates,
  type CandidateRow,
  type CandidateSkillsStats,
} from '@/types';

interface CandidatesListPageProps {
  organizationId: string;
}

export default function CandidatesListPage({
  organizationId,
}: CandidatesListPageProps) {
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateRow[]>(
    [],
  );
  const [mode, setMode] = useState<'interview' | 'practice'>('practice');

  const [searchQuery, setSearchQuery] = useState('');
  // We add skill selection + minScore
  const [skillFilter, setSkillFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [minScore, setMinScore] = useState<number>(0);

  const router = useRouter();
  // On mount, load the candidates
  useEffect(() => {
    setCandidates(mockCandidates);
  }, []);

  // Helper: Returns the candidate’s skill score for the selected mode
  function getCandidateSkillScore(
    cand: CandidateRow,
    skill: string,
  ): number | null {
    const stats =
      mode === 'interview'
        ? cand.interview_skill_stats
        : cand.practice_skill_stats;
    const found = stats.find((s) => s.skill === skill);
    return found ? found.avg_score : null;
  }

  // Helper: Compute candidate's best skill average from the selected mode stats
  function getBestSkillAvg(cand: CandidateRow): number {
    const stats =
      mode === 'interview'
        ? cand.interview_skill_stats
        : cand.practice_skill_stats;
    if (!stats || stats.length === 0) return 0;
    return stats.reduce((max, s) => Math.max(max, s.avg_score), 0);
  }

  // Calculate unlock cost based on best skill average.
  function getUnlockCost(cand: CandidateRow): number {
    const bestAvg = getBestSkillAvg(cand);
    if (bestAvg >= 90) return 3;
    if (bestAvg >= 80) return 2;
    return 1;
  }
  useEffect(() => {
    // 1) Filter out candidates that don’t have any stats for the selected mode.
    let filtered = candidates.filter((cand) => {
      if (mode === 'interview' && cand.interview_skill_stats.length === 0)
        return false;
      if (mode === 'practice' && cand.practice_skill_stats.length === 0)
        return false;
      return true;
    });

    // 2) Basic text search on name, role, or industry.
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter((c) => {
        const fullStr = c.full_name + c.role + c.industry;
        return fullStr.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // Filter by industry only if a specific industry is chosen.
    if (industryFilter.trim() !== '' && industryFilter !== 'All Industries') {
      filtered = filtered.filter((cand) => {
        return cand.industry
          .toLowerCase()
          .includes(industryFilter.toLowerCase());
      });
    }

    // Filter by skill and minimum score only if a specific skill is chosen.
    if (skillFilter.trim() !== '' && skillFilter !== 'All Skills') {
      filtered = filtered.filter((cand) => {
        const score = getCandidateSkillScore(cand, skillFilter);
        return score !== null && score >= minScore;
      });
    }

    setFilteredCandidates(filtered);
  }, [searchQuery, skillFilter, minScore, candidates, mode, industryFilter]);

  function handleViewCandidate(candidateId: string) {
    router.push(`/employer/${organizationId}/c/${candidateId}`);
  }

  // Use the mode state from your component in this helper.
  function getBestSkillObject(cand: CandidateRow): CandidateSkillsStats | null {
    const stats =
      mode === 'interview'
        ? cand.interview_skill_stats
        : cand.practice_skill_stats;
    if (stats.length === 0) return null;
    let best = stats[0];
    for (const s of stats) {
      if (s.avg_score > best.avg_score) {
        best = s;
      }
    }
    return best;
  }

  // Example of "Unlock" flow
  function handleUnlockCandidate(candidate: CandidateRow) {
    const cost = getUnlockCost(candidate);
    // In real code: call server action to spend tokens
    alert(
      `Unlocking ${candidate.full_name} for cost of ${cost} tokens (mock)!`,
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Tabs for Mode Selection */}
      <Tabs
        defaultValue="practice"
        onValueChange={(value) => setMode(value as 'interview' | 'practice')}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="practice">Practice Statistics</TabsTrigger>
          <TabsTrigger value="interview">Interview Statistics</TabsTrigger>
        </TabsList>
      </Tabs>
      {/* Header / Nav / Filter */}
      <div className="flex items-center h-full justify-between  gap-4 space-x-4">
        <button
          onClick={() => window.history.back()}
          className="rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 p-1"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <Input
          placeholder="Search name, role, industry..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Skill + Min Score Filter Row */}
        <div className="flex flex-col">
          <label className="text-sm text-muted-foreground mb-1">
            Industry Filter
          </label>
          <Select
            value={industryFilter}
            onValueChange={(e) => setIndustryFilter(e)}
          >
            <SelectTrigger className="w-full border border-gray-300 bg-white dark:bg-gray-800 rounded-md px-3 py-2 focus:outline-none text-sm">
              <SelectValue placeholder="All Industries" />
            </SelectTrigger>
            <SelectContent>
              {[
                'All Industries',
                'Tech',
                'IT',
                'Finance',
                'Healthcare',
                'Education',
                'Retail',
                'Real Estate',
                'Marketing',
              ].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Skill + Min Score Filter Row */}
        <div className="flex flex-col">
          <label className="text-sm text-muted-foreground mb-1">
            Skill Filter
          </label>
          <Select value={skillFilter} onValueChange={(e) => setSkillFilter(e)}>
            <SelectTrigger className="w-full border border-gray-300 bg-white dark:bg-gray-800 rounded-md px-3 py-2 focus:outline-none text-sm">
              <SelectValue placeholder="All Skills" />
            </SelectTrigger>
            <SelectContent>
              {[
                'All Skills',
                'Problem Solving',
                'Communication',
                'Teamwork',
                'Leadership',
                'Adaptability',
                'Decision Making',
              ].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
            {/* Add any other skill in your dataset */}
          </Select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-muted-foreground mb-1">
            Min. Average Score
          </label>
          <Input
            type="number"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="max-w-[100px]"
          />
        </div>
      </div>

      {/* Candidate Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Candidate Results</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCandidates.length === 0 ? (
            <p className="text-sm text-gray-500">No candidates found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Top Skill</TableHead>
                  <TableHead>Cost (Tokens)</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map((candidate) => {
                  const cost = getUnlockCost(candidate);
                  return (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage
                              src={candidate.avatar_url}
                              alt={candidate.full_name}
                            />
                            <AvatarFallback>
                              {candidate.full_name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {candidate.full_name}
                        </div>
                      </TableCell>
                      <TableCell>{candidate.role}</TableCell>
                      <TableCell>
                        {candidate.city}, {candidate.country}
                      </TableCell>
                      <TableCell>{candidate.industry}</TableCell>
                      <TableCell>
                        <TableCell className="flex justify-center items-center">
                          {(() => {
                            const bestSkill = getBestSkillObject(candidate);
                            if (!bestSkill) {
                              return (
                                <span className="text-sm text-muted-foreground"></span>
                              );
                            }

                            return (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="gap-1">
                                  <Star className="h-4 w-4 text-yellow-500" />
                                  {bestSkill.skill}
                                </Badge>
                                {/* <span className="text-sm text-foreground">({bestSkill.avg_score})</span> */}
                              </div>
                            );
                          })()}
                        </TableCell>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {cost} {cost > 1 ? 'tokens' : 'token'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnlockCandidate(candidate)}
                          >
                            Unlock
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleViewCandidate(candidate.id)}
                          >
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
