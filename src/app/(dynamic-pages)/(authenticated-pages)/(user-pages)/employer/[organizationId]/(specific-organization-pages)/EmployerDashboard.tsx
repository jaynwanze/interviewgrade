'use client';

import { MatchedCandidatesView } from '@/components/Employee/Dashboard/MatchedCandidatesView';
import { StatisticsView } from '@/components/Employee/Dashboard/StatisticsView';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  mockCandidates,
  type CandidateRow,
  type EmployerCandidatePreferences,
} from '@/types';
import { MultiSelectBox, MultiSelectBoxItem } from '@tremor/react';
import { useEffect, useState } from 'react';

// Example list of employer preferences
const employerOptions: EmployerCandidatePreferences[] = [
  { location: 'United States', industry: 'Tech', skill: 'Problem Solving' },
  { location: 'Canada', industry: 'Finance', skill: 'Communication' },
  { location: 'United Kingdom', industry: 'Marketing', skill: 'Teamwork' },
];

const availableIndustries = [
  'All Industries',
  'Tech',
  'IT',
  'Finance',
  'Healthcare',
  'Education',
  'Retail',
  'Real Estate',
  'Marketing',
];

const availableSkills = [
  'All Skills',
  'Problem Solving',
  'Communication',
  'Teamwork',
  'Leadership',
  'Adaptability',
  'Decision Making',
];

// The EmployerDashboard
export default function EmployerDashboard() {
  // Basic stats used in StatisticsView
  // const tokens = useTokens();
  const [stats] = useState({
    tokensLeft: 5,
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
  const [top3Worldwide, setTop3Worldwide] = useState<CandidateRow[]>([]);

  // We'll define a "mode" state: interview | practice
  const [mode, setMode] = useState<'interview' | 'practice'>('practice');
  // Employer preferences from a switcher
  // Multi-select filters: store as arrays.
  const [industryFilters, setIndustryFilters] = useState<string[]>([]);
  const [skillFilters, setSkillFilters] = useState<string[]>([]);

  const [employerPrefs] = useState<EmployerCandidatePreferences>({
    location: 'United States',
    industry: 'Tech', // We'll use skillFilters for skill selection.
    skill: 'Problem Solving',
  });

  // On initial mount, load our mock data
  useEffect(() => {
    setCandidates(mockCandidates);
  }, []);

  // Helper to get the candidate’s “best average skill” for the current mode
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
    // Allow candidates whose country includes the preferred location or is Remote.
    return (
      cand.country.includes(location) || cand.country.toLowerCase() === 'remote'
    );
  }

  //
  function industryMatches(cand: CandidateRow, industry: string) {
    return cand.industry.includes(industry);
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
      const industryMatch = industryMatches(cand, employerPrefs.industry);
      return locMatch && skillMatch && industryMatch;
    });

    // Industry multi-select: if any industry is selected and not "All Industries"
    if (
      industryFilters.length > 0 &&
      !industryFilters.includes('All Industries')
    ) {
      filtered = filtered.filter((cand) =>
        industryFilters.some((ind) =>
          cand.industry.toLowerCase().includes(ind.toLowerCase()),
        ),
      );
    }

    // Skill multi-select: if any skill is selected and not "All Skills"
    if (skillFilters.length > 0 && !skillFilters.includes('All Skills')) {
      filtered = filtered.filter((cand) =>
        skillFilters.some((skill) => {
          return hasPreferredSkill(cand, skill);
        }),
      );
    }

    // For location filtering, using employerPrefs.location.
    if (employerPrefs.location.trim() !== '') {
      filtered = filtered.filter((cand) => {
        return (
          cand.country.includes(employerPrefs.location) ||
          cand.country.toLowerCase() === 'remote'
        );
      });
    }

    // If no matches => skillGap
    if (filtered.length === 0) {
      setSkillGapMessage(
        `No candidates found for skill: ${employerPrefs.skill} in ${employerPrefs.industry}, ${employerPrefs.location} (mode: ${mode}).`,
      );
    } else {
      setSkillGapMessage('');
    }

    // 3) Sort by highest average skill
    const sorted = filtered.slice().sort((a, b) => {
      return (
        getCandidateScoreAvgBySkill(b, employerPrefs.skill) -
        getCandidateScoreAvgBySkill(a, employerPrefs.skill)
      );
    });

    // Global ranking: sort all candidates who have stats (without location filter)
    const globalCandidates = candidates.filter((cand) => {
      const stats =
        mode === 'interview'
          ? cand.interview_skill_stats
          : cand.practice_skill_stats;
      return stats && stats.length > 0;
    });

    const globalSorted = globalCandidates.slice().sort((a, b) => {
      return (
        getCandidateScoreAvgBySkill(b, employerPrefs.skill) -
        getCandidateScoreAvgBySkill(a, employerPrefs.skill)
      );
    });

    setMatched(sorted);

    // 4) topThree
    const top3 = sorted.slice(0, 3);
    setTopThree(top3);

    const topWorldwide = globalSorted.slice(0, 3);
    setTop3Worldwide(topWorldwide);

    // 5) topProspect
    setTopProspect(top3.length > 0 ? top3[0] : null);

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
  }, [mode, candidates, industryFilters, skillFilters, employerPrefs]);

  function handleIndustrySelect(value: string) {
    if (industryFilters.includes(value)) {
      setIndustryFilters(industryFilters.filter((v) => v !== value));
    } else {
      setIndustryFilters([...industryFilters, value]);
    }
  }
  function handleSkillSelect(value: string) {
    if (skillFilters.includes(value)) {
      setSkillFilters(skillFilters.filter((v) => v !== value));
    } else {
      setSkillFilters([...skillFilters, value]);
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold">Employer Dashboard</h1>
        <StatisticsView
          stats={stats}
          weekDelta={weekDelta}
          employerPrefs={employerPrefs}
        />
        <div className="flex justify-start text-center items-center gap-6">
          {/* Industry MultiSelect */}
          <div className="text-sm text-slate-500 w-full">
            <label className="text-sm text-muted-foreground mb-1">
              Industry
            </label>
            <MultiSelectBox
              value={industryFilters}
              onValueChange={(values) => setIndustryFilters(values)}
              placeholder="Select industries"
            >
              {availableIndustries.map((industry) => (
                <MultiSelectBoxItem key={industry} value={industry}>
                  {industry}
                </MultiSelectBoxItem>
              ))}
            </MultiSelectBox>
          </div>
          {/* Skill MultiSelect */}
          <div className="text-sm text-slate-500 w-full">
            <label className="text-sm text-muted-foreground mb-1">Skill</label>
            <MultiSelectBox
              value={skillFilters}
              onValueChange={(values) => setSkillFilters(values)}
              placeholder="Select skills"
            >
              {availableSkills.map((skill) => (
                <MultiSelectBoxItem key={skill} value={skill}>
                  {skill}
                </MultiSelectBoxItem>
              ))}
            </MultiSelectBox>
          </div>
          <div className="text-center text-sm text-slate-500 w-full ">
            <label className="text-sm text-muted-foreground mb-1">
              Location
            </label>
            <MultiSelectBox
              value={skillFilters}
              onValueChange={(values) => setSkillFilters(values)}
              placeholder="Select skills"
            >
              {availableSkills.map((skill) => (
                <MultiSelectBoxItem key={skill} value={skill}>
                  {skill}
                </MultiSelectBoxItem>
              ))}
            </MultiSelectBox>
          </div>

          {/* Example submit button (or you might trigger filtering onChange)
          <Button
            type="button"
            onClick={() =>
              console.log({
                searchQuery,
                selectedIndustries,
                selectedSkills,
                minScore,
              })
            }
          >
            Apply Filters
          </Button> */}
        </div>

        {/* TABS for "Interview Mode" / "Practice Mode" */}
        <h1 className="text-2xl font-bold">Candidate Statistics</h1>
        <Tabs
          defaultValue="practice"
          onValueChange={(value) => setMode(value as 'interview' | 'practice')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="practice">Practice Statistics</TabsTrigger>
            <TabsTrigger value="interview">Interview Statistics</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Show Matches */}
        <MatchedCandidatesView
          skillGapMessage={skillGapMessage}
          topThree={topThree}
          topProspect={topProspect}
          matched={matched}
          top3Worldwide={top3Worldwide}
          mode={mode}
          employersPrefs={employerPrefs}
        />
      </div>
    </TooltipProvider>
  );
}
