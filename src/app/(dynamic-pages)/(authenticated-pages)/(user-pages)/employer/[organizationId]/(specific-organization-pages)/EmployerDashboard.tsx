'use client';

import { useEffect, useState } from 'react';

import { MatchedCandidatesView } from '@/components/Employee/Dashboard/MatchedCandidatesView';
import { StatisticsView } from '@/components/Employee/Dashboard/StatisticsView';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock candidate data
const mockCandidates = [
  {
    id: 'c1',
    name: 'Alice',
    location: 'United States',
    skill: 'Communication',
    score: 95,
    avatarUrl: '/images/mock_avatar_f_1.jpg',
    lastWeekScore: 92, // For "trend" calculation
  },
  {
    id: 'c2',
    name: 'Bob',
    location: 'United States',
    skill: 'Problem Solving',
    score: 92,
    avatarUrl: '/images/mock_avatar_m_2.jpg',
    lastWeekScore: 90,
  },
  {
    id: 'c3',
    name: 'Charlie',
    location: 'Canada',
    skill: 'Decision Making',
    score: 88,
    avatarUrl: '/images/mock_avatar_m_3.jpg',
    lastWeekScore: 88,
  },
  {
    id: 'c4',
    name: 'Diana',
    location: 'Remote',
    skill: 'Problem Solving',
    score: 90,
    avatarUrl: '/images/mock_avatar_f_4.jpg',
    lastWeekScore: 89,
  },
  {
    id: 'c5',
    name: 'Burt',
    location: 'United States',
    skill: 'Problem Solving',
    score: 92,
    avatarUrl: '/images/mock_avatar_m_5.jpg',
    lastWeekScore: 0, // Maybe new or no data last week
  },
  {
    id: 'c6',
    name: 'Erin',
    location: 'United States',
    skill: 'Communication',
    score: 89,
    avatarUrl: '/images/mock_avatar_f_6.jpg',
    lastWeekScore: 90,
  },
];


const mockEmployerPrefs = {
  location: 'United States',
  skill: ['Problem Solving', 'Communication'], // multiple skills
};

export default function EmployerDashboard() {
  // Basic stats
  const [stats] = useState({
    tokensLeft: 8,
    activeSearches: 2,
    newCandidatesThisWeek: 5,
  });

  const [prefs, setPrefs] = useState<typeof mockEmployerPrefs | null>(null);
  const [matched, setMatched] = useState<any[]>([]);
  const [topThree, setTopThree] = useState<any[]>([]);
  const [topProspect, setTopProspect] = useState<any>(null);
  const [candidatesToWatch, setCandidatesToWatch] = useState<any[]>([]);
  const [skillGapMessage, setSkillGapMessage] = useState<string>('');
  const [percentiles, setPercentiles] = useState<{ [id: string]: number }>({});
  const [weekDelta, setWeekDelta] = useState<number>(0);
  const [chartCandidates, setChartCandidates] = useState<TopCandidate[]>([]);

  useEffect(() => {
    // 1) Suppose we fetch employer’s prefs from DB; using mock for now
    setPrefs(mockEmployerPrefs);

    // 2) Filter from mockCandidates
    const filtered = mockCandidates
      .filter(
        (c) =>
          (mockEmployerPrefs.location === 'Remote'
            ? true
            : c.location.includes(mockEmployerPrefs.location)) &&
          c.skill.includes(mockEmployerPrefs.skill[0]),
      )
      .sort((a, b) => b.score - a.score);

    setMatched(filtered);

    // 3) If none found => skill gap
    if (filtered.length === 0) {
      setSkillGapMessage(
        `No candidates found for skill: ${mockEmployerPrefs.skill} in ${mockEmployerPrefs.location}. 
         You may broaden your search or consider remote options.`,
      );
      return;
    } else {
      setSkillGapMessage('');
    }

    // 4) Top 3 => Leaderboard
    const top3 = filtered.slice(0, 3);
    setTopThree(top3);

    // 5) The #1 => Top Prospect
    setTopProspect(top3[0] || null);

    // 6) Next few => "Candidates to Watch"
    const watch = filtered.slice(3, 6);
    setCandidatesToWatch(watch);

    // 7) Percentile calculation
    const total = filtered.length;
    const scoresSorted = filtered.map((m) => m.score).sort((a, b) => a - b);
    const pMap: { [id: string]: number } = {};
    filtered.forEach((cand) => {
      const countLessOrEqual = scoresSorted.filter(
        (s) => s <= cand.score,
      ).length;
      const percentile = (countLessOrEqual / total) * 100;
      pMap[cand.id] = percentile;
    });
    setPercentiles(pMap);

    // 8) Trend over time => e.g., average difference vs last week
    const avgThisWeek =
      filtered.reduce((sum, c) => sum + c.score, 0) / filtered.length;
    const withLastWeek = filtered.filter(
      (c) => c.lastWeekScore && c.lastWeekScore > 0,
    );
    if (withLastWeek.length > 0) {
      const avgLastWeek =
        withLastWeek.reduce((sum, c) => sum + (c.lastWeekScore ?? 0), 0) /
        withLastWeek.length;
      setWeekDelta(avgThisWeek - avgLastWeek);
    }
  }, []);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Employer Dashboard</h1>
        {/* Stats View */}
        <StatisticsView stats={stats} weekDelta={weekDelta} />

        {/* Employer Prefs */}
        {prefs ? (
          <p className="text-sm text-muted-foreground">
            Showing matches for location <strong>{prefs.location}</strong> and
            skill <strong>{prefs.skill}</strong>.
          </p>
        ) : (
          <p>Loading your preferences...</p>
        )}
        <MatchedCandidatesView
          {...{
            matched,
            topThree,
            topProspect,
            candidatesToWatch,
            percentiles,
            skillGapMessage,
          }}
        />
      </div>
    </TooltipProvider>
  );
}
