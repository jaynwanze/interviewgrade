'use client';

import { ChevronLeft, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { CandidateFilters } from '@/components/Employee/Dashboard/Search/CandidateFilters';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCandidates } from '@/data/user/employee';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State to store selected filters
  const [filters, setFilters] = useState({
    industry: 'All Industries',
    skill: 'All Skills',
    location: 'All Locations',
    minScore: 0,
    searchQuery: '',
  });

  const router = useRouter();
  // On mount, load the candidates
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const candData = await getCandidates();
        setCandidates(candData.concat(mockCandidates));

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    fetchData();
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
    if (!stats || stats.length === 0) return null;
    const found = stats.find((s) => s.skill === skill);
    return found ? found.avg_score : null;
  }

  // // Helper: Compute candidate's best skill average from the selected mode stats
  // function getBestSkillAvg(cand: CandidateRow): number {
  //   const stats =
  //     mode === 'interview'
  //       ? cand.interview_skill_stats
  //       : cand.practice_skill_stats;
  //   if (!stats || stats.length === 0) return 0;
  //   return stats.reduce((max, s) => Math.max(max, s.avg_score), 0);
  // }

  useEffect(() => {
    // 1) Filter out candidates that don’t have any stats for the selected mode.
    let filtered = candidates.filter((cand) => {
      if (mode === 'interview' && !cand.interview_skill_stats) return false;
      if (mode === 'practice' && !cand.practice_skill_stats) return false;
      return true;
    });

    // 2) Basic text search on name, role, or industry.
    if (filters.searchQuery.trim()) {
      filtered = filtered.filter((c) => {
        const fullStr = c.full_name + c.role + c.industry;
        return fullStr
          .toLowerCase()
          .includes(filters.searchQuery.toLowerCase());
      });
    }

    // Filter by industry only if a specific industry is chosen.
    if (filters.industry !== 'All Industries') {
      filtered = filtered.filter((cand) =>
        cand.industry.includes(filters.industry),
      );
    }

    if (filters.skill !== 'All Skills') {
      // Filter by skill and minimum score only if a specific skill is chosen.
      filtered = filtered.filter((cand) => {
        const score = getCandidateSkillScore(cand, filters.skill);
        return score !== null && score >= filters.minScore;
      });
    }

    // Filter by location
    if (filters.location !== 'All Locations') {
      // e.g. match or 'remote'
      filtered = filtered.filter(
        (cand) =>
          cand.country.includes(filters.location) ||
          cand.country.toLowerCase() === 'remote',
      );
    }

    setFilteredCandidates(filtered);
  }, [filters, candidates, mode]);

  function handleViewCandidate(candidateId: string) {
    router.push(`/employer/${organizationId}/c/${candidateId}`);
  }

  // Use the mode state from your component in this helper.
  function getBestSkillObject(cand: CandidateRow): CandidateSkillsStats | null {
    const stats =
      mode === 'interview'
        ? cand.interview_skill_stats
        : cand.practice_skill_stats;
    if (stats === null) return null;
    let best = stats[0];
    for (const s of stats) {
      if (s.avg_score > best.avg_score) {
        best = s;
      }
    }
    return best;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Candidate Search</h1>
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
      <div className="flex items-center h-full w-full justify-between gap-4 space-x-4">
        <div className="flex flex-wrap gap-4 ">
          <button
            onClick={() => window.history.back()}
            className="rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 p-1"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          {/* Reusable Filter Bar */}
          <CandidateFilters
            // If you have saved prefs, pass them here as initial or override
            industryValue={'All Industries'}
            skillValue={'All Skills'}
            locationValue={'All Locations'}
            minScoreValue={0}
            searchQueryValue={''}
            onChange={(updated) => setFilters(updated)}
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
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map((candidate) => {
                  const bestSkill = getBestSkillObject(candidate);
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
                      <TableCell className="justify-center ">
                        {bestSkill ? (
                          <>
                            <Badge variant="outline" className="gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              {bestSkill.skill}
                            </Badge>
                          </>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      {/* <TableCell>
                        <Badge variant="outline">
                          {cost} {cost > 1 ? 'tokens' : 'token'}
                        </Badge>
                      </TableCell> */}
                      <TableCell>
                        <div className="flex gap-2">
                          {/* <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnlockCandidate(candidate)}
                          >
                            Unlock
                          </Button> */}
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
