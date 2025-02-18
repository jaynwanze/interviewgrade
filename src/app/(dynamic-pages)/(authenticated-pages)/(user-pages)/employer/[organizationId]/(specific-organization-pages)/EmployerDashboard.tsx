'use client';

import { useEffect, useState } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { StatisticsView } from '@/components/Employee/Dashboard/StatisticsView';
import { MatchedCandidatesView } from '@/components/Employee/Dashboard/MatchedCandidatesView';
import type { CandidateRow } from '@/types';

const mockCandidates: CandidateRow[] = [
  {
    id: 'c1',
    city: 'New York',
    country: 'United States',
    phone_number: '(555) 123-4567',
    summary: 'Enthusiastic engineer with strong communication skills.',
    role: 'Software Engineer',
    industry: 'Tech',
    interview_skill_stats: [
      { id: '1', skill: 'Problem Solving', avg_score: 92, previous_avg: 90 },
      { id: '2', skill: 'Communication', avg_score: 88, previous_avg: 85 },
      { id: '3', skill: 'Teamwork', avg_score: 90, previous_avg: 88 },
    ],
    practice_skill_stats: [
      { id: 'p1', skill: 'Problem Solving', avg_score: 89, previous_avg: 87 },
    ],
    created_at: '2024-04-29T10:00:00Z',
    full_name: 'Alice Anderson',
    avatar_url: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp',
    email: 'jonjfjegji',
  },
  {
    id: 'c2',
    city: 'San Francisco',
    country: 'United States',
    phone_number: '(555) 555-1234',
    summary: 'Full-stack developer with a focus on back-end optimization.',
    role: 'Full-Stack Developer',
    industry: 'Tech',
    interview_skill_stats: [
      { id: '4', skill: 'Problem Solving', avg_score: 85, previous_avg: 82 },
      { id: '5', skill: 'Communication', avg_score: 80, previous_avg: 78 },
    ],
    practice_skill_stats: [
      { id: 'p2', skill: 'Problem Solving', avg_score: 83, previous_avg: 80 },
      { id: 'p3', skill: 'Communication', avg_score: 81, previous_avg: 76 },
    ],
    created_at: '2024-04-20T09:30:00Z',
    full_name: 'Bob Brown',
    avatar_url: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp',
    email: 'jonjfjegji',

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
      { id: '6', skill: 'Decision Making', avg_score: 88, previous_avg: 85 },
      { id: '7', skill: 'Analytical Thinking', avg_score: 90, previous_avg: 88 },
    ],
    practice_skill_stats: [],
    created_at: '2024-04-22T14:15:00Z',
    full_name: 'Charlie Davis',
    avatar_url: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp',
    email: 'jonjfjegji',
  },
  {
    id: 'c4',
    city: 'Remote',
    country: 'Remote',
    phone_number: '(555) 999-9999',
    summary: 'Problem solver with a knack for creative solutions.',
    role: 'Product Manager',
    industry: 'Tech',
    interview_skill_stats: [
      { id: '8', skill: 'Problem Solving', avg_score: 90, previous_avg: 85 },
      { id: '9', skill: 'Leadership', avg_score: 87, previous_avg: 86 },
    ],
    practice_skill_stats: [
      { id: 'p4', skill: 'Leadership', avg_score: 88, previous_avg: 84 },
    ],
    created_at: '2024-04-25T11:45:00Z',
    full_name: 'Diana Evans',
    avatar_url: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp',
    email: 'jonjfjegji',
  },
  {
    id: 'c5',
    city: 'Dublin',
    country: 'Ireland',
    phone_number: '+353 12 345 6789',
    summary: 'Focused on continuous improvement and quick learning.',
    role: 'Software Engineer',
    industry: 'Tech',
    interview_skill_stats: [
      { id: '10', skill: 'Adaptability', avg_score: 92, previous_avg: 90 },
      { id: '11', skill: 'Communication', avg_score: 84, previous_avg: 80 },
    ],
    practice_skill_stats: [
      { id: 'p5', skill: 'Adaptability', avg_score: 88, previous_avg: 85 },
    ],
    created_at: '2024-04-27T07:00:00Z',
    full_name: 'Erin Green',
    avatar_url: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp',
    email: 'jonjfjegji',
  },
];

const employerPrefs = {
  location: 'United States',
  skill: 'Problem Solving', // Looking for Problem Solving skill
};

export default function EmployerDashboard() {
  const [stats] = useState({
    tokensLeft: 8,
    activeSearches: 2,
    newCandidatesThisWeek: 5,
  });

  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [matched, setMatched] = useState<CandidateRow[]>([]);
  const [topThree, setTopThree] = useState<CandidateRow[]>([]);
  const [topProspect, setTopProspect] = useState<CandidateRow | null>(null);
  const [skillGapMessage, setSkillGapMessage] = useState('');
  const [weekDelta, setWeekDelta] = useState<number>(0);
  const [percentiles, setPercentiles] = useState<{ [id: string]: number }>({});

  // Helper to get average interview skill for sorting
  function getCandidateInterviewAvg(cand: CandidateRow): number {
    if (!cand.interview_skill_stats || cand.interview_skill_stats.length === 0) {
      return 0;
    }
    const sum = cand.interview_skill_stats.reduce((acc, s) => acc + s.avg_score, 0);
    return sum / cand.interview_skill_stats.length;
  }

  // Check if candidate’s interview_skill_stats contains the target skill
  function hasSkill(cand: CandidateRow, skill: string): boolean {
    return cand.interview_skill_stats.some((s) => s.skill === skill);
  }

  // Check if candidate location is either the same as employerPrefs.location
  // or “Remote” if that’s acceptable.
  function locationMatches(cand: CandidateRow, location: string) {
    if (location === 'Remote') return true; // accept everything
    return cand.country === location;
  }

  useEffect(() => {
    // 1) Initially set all mock data
    setCandidates(mockCandidates);

    // 2) Filter by location + skill
    const filtered = mockCandidates.filter((cand) => {
      // location check
      const locMatch = locationMatches(cand, employerPrefs.location);
      // skill check
      const skillMatch = hasSkill(cand, employerPrefs.skill);
      return locMatch && skillMatch;
    });

    // If no matches => skillGap
    if (filtered.length === 0) {
      setSkillGapMessage(
        `No candidates found for skill: ${employerPrefs.skill} in ${employerPrefs.location}. 
         You may broaden your search or consider remote options.`
      );
    } else {
      setSkillGapMessage('');
    }

    // 3) Sort by highest average interview skill
    const sorted = filtered.slice().sort((a, b) => {
      return getCandidateInterviewAvg(b) - getCandidateInterviewAvg(a);
    });

    setMatched(sorted);

    // 4) topThree
    const top3 = sorted.slice(0, 3);
    setTopThree(top3);

    // 5) topProspect = first of top3 (or null)
    setTopProspect(top3.length > 0 ? top3[0] : null);

    // 7) Calculate percentiles based on “avg interview skill”
    if (sorted.length > 0) {
      const scoresOnly = sorted.map((cand) => getCandidateInterviewAvg(cand)).sort((a,b)=>a-b);
      const pMap: { [id: string]: number } = {};
      sorted.forEach((cand) => {
        const candidateAvg = getCandidateInterviewAvg(cand);
        // how many are <= my score
        const lessOrEqual = scoresOnly.filter((s) => s <= candidateAvg).length;
        const percentile = (lessOrEqual / sorted.length) * 100;
        pMap[cand.id] = percentile;
      });
      setPercentiles(pMap);
    }

    // 8) compute overall weekDelta => sum of (avg_score - previous_avg) / count
    let totalDelta = 0;
    let deltaCount = 0;
    mockCandidates.forEach((cand) => {
      cand.interview_skill_stats.forEach((skill) => {
        if (skill.previous_avg != null) {
          totalDelta += (skill.avg_score - skill.previous_avg);
          deltaCount += 1;
        }
      });
    });
    if (deltaCount > 0) {
      setWeekDelta(totalDelta / deltaCount);
    }
  }, []);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Employer Dashboard</h1>
        {/* Stats */}
        <StatisticsView stats={stats} weekDelta={weekDelta} />

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
