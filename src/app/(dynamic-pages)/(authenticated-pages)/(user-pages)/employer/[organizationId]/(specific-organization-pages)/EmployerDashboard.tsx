'use client';

import { MatchedCandidatesView } from '@/components/Employee/Dashboard/MatchedCandidatesView';
import { StatisticsView } from '@/components/Employee/Dashboard/StatisticsView';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { CandidateRow } from '@/types';
import { useEffect, useState } from 'react';
const mockCandidates: CandidateRow[] = [
  {
    id: 'c1',
    city: 'New York',
    country: 'United States',
    phone_number: '(555) 123-4567',
    summary: 'Enthusiastic engineer with strong communication skills.',
    role: 'Software Engineer',
    industry: 'Tech',
    practice_skill_stats: [
      { id: '1', skill: 'Problem Solving', avg_score: 92, previous_avg: 90 },
      { id: '2', skill: 'Communication', avg_score: 88, previous_avg: 85 },
      { id: '3', skill: 'Teamwork', avg_score: 90, previous_avg: 88 },
    ],
    interview_skill_stats: [
      { id: 'p1', skill: 'Behavioural', avg_score: 89, previous_avg: 87 },
    ],
    created_at: '2024-04-29T10:00:00Z',
    full_name: 'Alice Anderson',
    avatar_url:
      'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp',
    email: 'alice@example.com',
  },
  {
    id: 'c2',
    city: 'San Francisco',
    country: 'United States',
    phone_number: '(555) 555-1234',
    summary: 'Full-stack developer with a focus on back-end optimization.',
    role: 'Full-Stack Developer',
    industry: 'Tech',
    practice_skill_stats: [
      { id: 'p2', skill: 'Problem Solving', avg_score: 83, previous_avg: 80 },
      { id: 'p3', skill: 'Communication', avg_score: 81, previous_avg: 76 },
    ],
    interview_skill_stats: [
      { id: '4', skill: 'Behavioural', avg_score: 85, previous_avg: 82 },
      { id: '5', skill: 'Technical', avg_score: 80, previous_avg: 78 },
    ],
    created_at: '2024-04-20T09:30:00Z',
    full_name: 'Bob Brown',
    avatar_url:
      'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp',
    email: 'bob@example.com',
  },
  {
    id: 'c3',
    city: 'Toronto',
    country: 'Canada',
    phone_number: '(416) 999-0000',
    summary: 'Skilled data analyst passionate about Decision Making & stats.',
    role: 'Data Analyst',
    industry: 'Finance',
    interview_skill_stats: [
      { id: '6', skill: 'Behavioural', avg_score: 88, previous_avg: 85 },
      {
        id: '7',
        skill: 'Technical',
        avg_score: 90,
        previous_avg: 88,
      },
    ],
    practice_skill_stats: [],
    created_at: '2024-04-22T14:15:00Z',
    full_name: 'Charlie Davis',
    avatar_url:
      'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp',
    email: 'charlie@example.com',
  },
  {
    id: 'c4',
    city: 'Remote',
    country: 'Remote',
    phone_number: '(555) 999-9999',
    summary: 'Problem solver with a knack for creative solutions.',
    role: 'Product Manager',
    industry: 'Tech',
    practice_skill_stats: [
      { id: '8', skill: 'Problem Solving', avg_score: 90, previous_avg: 85 },
      { id: '9', skill: 'Leadership', avg_score: 87, previous_avg: 86 },
    ],
    interview_skill_stats: [
      { id: 'p4', skill: 'Behavioural', avg_score: 88, previous_avg: 84 },
    ],
    created_at: '2024-04-25T11:45:00Z',
    full_name: 'Diana Evans',
    avatar_url:
      'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp',
    email: 'diana@example.com',
  },
  {
    id: 'c5',
    city: 'Dublin',
    country: 'Ireland',
    phone_number: '+353 12 345 6789',
    summary: 'Focused on continuous improvement and quick learning.',
    role: 'Software Engineer',
    industry: 'Tech',
    practice_skill_stats: [
      { id: '10', skill: 'Adaptability', avg_score: 92, previous_avg: 90 },
      { id: '11', skill: 'Communication', avg_score: 84, previous_avg: 80 },
    ],
    interview_skill_stats: [
      { id: 'p5', skill: 'Behavioural', avg_score: 88, previous_avg: 85 },
    ],
    created_at: '2024-04-27T07:00:00Z',
    full_name: 'Erin Green',
    avatar_url:
      'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp',
    email: 'erin@example.com',
  },
];

// If you want a location preference or skill preference from the employer
const employerPrefs = {
  location: 'United States',
  skill: 'Problem Solving',
};

// The EmployerDashboard
export default function EmployerDashboard() {
  // Basic stats used in StatisticsView
  const [stats] = useState({
    tokensLeft: 8,
    incomingPipeline: 2,
    unlockedCandidates: 5,
  });

  // The candidate array
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);

  // The final matched results after filtering
  const [matched, setMatched] = useState<CandidateRow[]>([]);
  const [topThree, setTopThree] = useState<CandidateRow[]>([]);
  const [topProspect, setTopProspect] = useState<CandidateRow | null>(null);
  const [skillGapMessage, setSkillGapMessage] = useState('');
  const [weekDelta, setWeekDelta] = useState<number>(0);
  const [percentiles, setPercentiles] = useState<{ [id: string]: number }>({});

  // We'll define a "mode" state: interview | practice
  const [mode, setMode] = useState<'interview' | 'practice'>('practice');

  // On initial mount, load our mock data
  useEffect(() => {
    setCandidates(mockCandidates);
  }, []);

  // Helper to get the candidate’s “best average skill” for the current mode
  function getCandidateAvg(cand: CandidateRow): number {
    const stats =
      mode === 'interview'
        ? cand.interview_skill_stats
        : cand.practice_skill_stats;
    if (!stats || stats.length === 0) {
      return 0;
    }
    const sum = stats.reduce((acc, s) => acc + s.avg_score, 0);
    return sum / stats.length;
  }

  // Check if candidate has the employer’s preferred skill in the selected mode
  function hasPreferredSkill(cand: CandidateRow, skill: string): boolean {
    const stats =
      mode === 'interview'
        ? cand.interview_skill_stats
        : cand.practice_skill_stats;
    return stats.some((s) => s.skill === skill);
  }

  // Check if candidate location matches employer’s preference or is “Remote”
  function locationMatches(cand: CandidateRow, location: string) {
    if (location === 'Remote') return true;
    return cand.country === location;
  }

  // The main effect that filters + sorts whenever `mode` or candidates change
  useEffect(() => {
    // 1) Filter out any candidate who doesn’t have stats for the selected mode
    let filtered = candidates.filter((cand) => {
      if (mode === 'interview' && cand.interview_skill_stats.length === 0) {
        return false;
      }
      if (mode === 'practice' && cand.practice_skill_stats.length === 0) {
        return false;
      }
      return true;
    });

    // 2) If we want to filter by location + skill preference:
    filtered = filtered.filter((cand) => {
      const locMatch = locationMatches(cand, employerPrefs.location);
      const skillMatch = hasPreferredSkill(cand, employerPrefs.skill);
      return locMatch && skillMatch;
    });

    // If no matches => skillGap
    if (filtered.length === 0) {
      setSkillGapMessage(
        `No candidates found for skill: ${employerPrefs.skill} in ${employerPrefs.location} (mode: ${mode}).`,
      );
    } else {
      setSkillGapMessage('');
    }

    // 3) Sort by highest average skill
    const sorted = filtered.slice().sort((a, b) => {
      return getCandidateAvg(b) - getCandidateAvg(a);
    });

    setMatched(sorted);

    // 4) topThree
    const top3 = sorted.slice(0, 3);
    setTopThree(top3);

    // 5) topProspect
    setTopProspect(top3.length > 0 ? top3[0] : null);

    // 6) Calculate percentiles
    if (sorted.length > 0) {
      const scoresOnly = sorted.map(getCandidateAvg).sort((a, b) => a - b);
      const pMap: { [id: string]: number } = {};

      sorted.forEach((cand) => {
        const candidateAvg = getCandidateAvg(cand);
        const lessOrEqual = scoresOnly.filter((s) => s <= candidateAvg).length;
        const percentile = (lessOrEqual / sorted.length) * 100;
        pMap[cand.id] = percentile;
      });

      setPercentiles(pMap);
    } else {
      setPercentiles({});
    }

    // 7) Example: compute overall weekDelta => sum of (avg_score - previous_avg)
    // We'll do it for whichever mode is selected
    let totalDelta = 0;
    let deltaCount = 0;

    candidates.forEach((cand) => {
      const stats =
        mode === 'interview'
          ? cand.interview_skill_stats
          : cand.practice_skill_stats;

      stats.forEach((skill) => {
        if (skill.previous_avg != null) {
          totalDelta += skill.avg_score - skill.previous_avg;
          deltaCount += 1;
        }
      });
    });

    if (deltaCount > 0) {
      setWeekDelta(totalDelta / deltaCount);
    } else {
      setWeekDelta(0);
    }
  }, [mode, candidates]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Employer Dashboard</h1>

        {/* TABS for "Interview Mode" / "Practice Mode" */}
        <Tabs
          defaultValue="practice"
          onValueChange={(value) => setMode(value as 'interview' | 'practice')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="practice">Practice Mode</TabsTrigger>
            <TabsTrigger value="interview">Interview Mode</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Stats */}
        <StatisticsView stats={stats} weekDelta={weekDelta} />

        {/* Show Matches */}
        <MatchedCandidatesView
          skillGapMessage={skillGapMessage}
          topThree={topThree}
          topProspect={topProspect}
          matched={matched}
          percentiles={percentiles}
        />
      </div>
    </TooltipProvider>
  );
}