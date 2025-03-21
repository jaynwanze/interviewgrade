'use client';

import { MatchedCandidatesView } from '@/components/Employee/Dashboard/MatchedCandidatesView';
import { StatisticsView } from '@/components/Employee/Dashboard/StatisticsView';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  getCandidates,
  getEmployerCandidatePreferences,
} from '@/data/user/employee';
import {
  mockCandidates,
  type CandidateRow,
  type EmployerCandidatePreferences,
} from '@/types';
import { ChevronsUpDown } from 'lucide-react';
import { useEffect, useState } from 'react';

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
  'Problem Solving',
  'Communication',
  'Teamwork',
  'Leadership',
  'Adaptability',
  'Decision Making',
];

const availableLocations = [
  'All Locations',
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Germany',
  'India',
  'Remote',
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
  const [employerPrefs, setEmployerPrefs] =
    useState<EmployerCandidatePreferences | null>(null);
  const [didSetFilters, setDidSetFilters] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // We'll define a "mode" state: interview | practice
  const [mode, setMode] = useState<'interview' | 'practice'>('practice');
  // Employer preferences from a switcher
  // Multi-select filters: store as arrays.
  const [industryFilter, setIndustryFilter] =
    useState<string>('All Industries');
  const [skillFilter, setSkillFilter] = useState<string>('Select Skill');
  const [locationFilter, setLocationFilter] = useState<string>('All Locations');
  const [industryOpen, setIndustryOpen] = useState(false);
  const [skillOpen, setSkillOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  // On initial mount, load our mock data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getEmployerCandidatePreferences();
        setEmployerPrefs(data);

        if (data && !didSetFilters) {
          setIndustryFilter(data.industry || 'All Industries');
          setSkillFilter(data.skills || 'Select Skill');
          setLocationFilter(data.location || 'All Locations');
          setDidSetFilters(true);
        }

        const candidates = await getCandidates();
        setCandidates(candidates.concat(mockCandidates));

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    fetchData();
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
  // The main effect that filters + sorts whenever `mode` or candidates change
  useEffect(() => {
    // 1) Filter out candidates without stats in the selected mode
    let filtered = candidates.filter((cand) => {
      if (mode === 'interview' && !cand.interview_skill_stats) return false;
      if (mode === 'practice' && !cand.practice_skill_stats) return false;
      return true;
    });

    // 2) Filter by industry if user picked something other than "All Industries"
    if (industryFilter !== 'All Industries') {
      filtered = filtered.filter((cand) =>
        cand.industry.includes(industryFilter),
      );
    }

    // 3) Filter by skill
    filtered = filtered.filter((cand) => {
      const stats =
        mode === 'interview'
          ? cand.interview_skill_stats
          : cand.practice_skill_stats;
      return stats?.some((s) => s.skill === skillFilter);
    });

    // 4) Filter by location if user picked something other than "All Locations"
    if (locationFilter !== 'All Locations') {
      filtered = filtered.filter((cand) => {
        // Example: match location or 'remote'
        return (
          cand.country.includes(locationFilter) ||
          cand.country.toLowerCase() === 'remote'
        );
      });
    }

    // 5) If no matches => set skill gap message (or clear it otherwise)
    if (filtered.length === 0) {
      setSkillGapMessage(
        `No candidates found for your selected filters -
         Industry: ${industryFilter}, 
         Skill: ${skillFilter}, 
         Location: ${locationFilter}.`,
      );
    } else {
      setSkillGapMessage('');
    }

    // 6) Sort the filtered results — typically by skillFilter
    let skillToSortBy = skillFilter;
    if (!skillToSortBy) {
      skillToSortBy = employerPrefs?.skills || '';
    }

    const sorted = filtered.slice().sort((a, b) => {
      return (
        getCandidateScoreAvgBySkill(b, skillToSortBy) -
        getCandidateScoreAvgBySkill(a, skillToSortBy)
      );
    });

    // 7) Set matched, topThree, topProspect, etc.
    setMatched(sorted);
    setTopThree(sorted.slice(0, 3));
    setTopProspect(sorted.length > 0 ? sorted[0] : null);

    // 8) Global ranking for "top3Worldwide" (optional)
    const globalCandidates = candidates.filter((cand) => {
      const stats =
        mode === 'interview'
          ? cand.interview_skill_stats
          : cand.practice_skill_stats;
      return stats && stats.length > 0;
    });
    const globalSorted = globalCandidates.slice().sort((a, b) => {
      return (
        getCandidateScoreAvgBySkill(b, skillToSortBy) -
        getCandidateScoreAvgBySkill(a, skillToSortBy)
      );
    });
    setTop3Worldwide(globalSorted.slice(0, 3));

    // 9) Example: compute your weekDelta
    let totalDelta = 0;
    let deltaCount = 0;
    candidates.forEach((cand) => {
      const stats =
        mode === 'interview'
          ? cand.interview_skill_stats
          : cand.practice_skill_stats;
      if (stats) {
        stats.forEach((skill) => {
          if (skill.previous_avg != null) {
            totalDelta += skill.avg_score - skill.previous_avg;
            deltaCount += 1;
          }
        });
      }
    });
    setWeekDelta(deltaCount > 0 ? totalDelta / deltaCount : 0);
  }, [
    mode,
    candidates,
    industryFilter,
    skillFilter,
    locationFilter,
    employerPrefs,
  ]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto min-h-screen">
        <h1 className="text-2xl font-bold">Candidate Dashboard</h1>
        <LoadingSpinner />
      </div>
    );
  } else if (error) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto min-h-screen  ">
        <h1 className="text-2xl font-bold">Candidate Dashboard</h1>
        <p className="text-red-500">{error}</p>
      </div>
    );
  } else
    return (
      <TooltipProvider>
        <div className="space-y-6 max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold">Candidate Dashboard</h1>

          {employerPrefs && (
            <StatisticsView
              stats={stats}
              weekDelta={weekDelta}
              employerPrefs={employerPrefs}
            />
          )}
          <div className="flex flex-wrap justify-start gap-2">
            {/* Industry MultiSelect */}
            <div className="flex flex-col text-sm text-slate-500 w-full sm:w-[200px]">
              <label className="text-sm text-muted-foreground mb-1">
                Industry
              </label>
              <Popover open={industryOpen} onOpenChange={setIndustryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={industryOpen}
                    aria-haspopup="listbox"
                    className="w-full justify-between"
                  >
                    <span className="truncate">
                      {industryFilter || 'All Industries...'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full min-w-[200px] max-w-[300px] p-0 z-40 mt-2">
                  <Command>
                    <CommandInput placeholder="Search industry..." />
                    <CommandList>
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup heading="Industries">
                        {availableIndustries.map((industry) => (
                          <CommandItem
                            key={industry}
                            value={industry}
                            onSelect={() => {
                              setIndustryFilter(industry);
                              setEmployerPrefs((prev) =>
                                prev
                                  ? { ...prev, industry: industry }
                                  : {
                                    industry: industry,
                                    location: '',
                                    skills: '',
                                  },
                              );
                              setIndustryOpen(false);
                            }}
                          >
                            {industry}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Skill MultiSelect */}
            <div className="flex flex-col text-sm text-slate-500 w-full sm:w-[200px]">
              <label className="text-sm text-muted-foreground mb-1">
                Skill
              </label>
              <Popover open={skillOpen} onOpenChange={setSkillOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={skillOpen}
                    aria-haspopup="listbox"
                    className="w-full justify-between"
                  >
                    <span className="truncate">
                      {skillFilter || 'Select Skill...'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full min-w-[100px] max-w-[300px] p-0 z-40 mt-2">
                  <Command>
                    <CommandInput placeholder="Search skill..." />
                    <CommandList className="w-full h-full">
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup heading="Skills">
                        {availableSkills.map((skill) => (
                          <CommandItem
                            key={skill}
                            value={skill}
                            onSelect={() => {
                              setSkillFilter(skill);
                              setEmployerPrefs((prev) =>
                                prev
                                  ? { ...prev, skills: skill }
                                  : {
                                    industry: '',
                                    location: '',
                                    skills: skill,
                                  },
                              );
                              setSkillOpen(false);
                            }}
                          >
                            {skill}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Location MultiSelect */}
            <div className="flex flex-col text-sm text-slate-500 w-full sm:w-[200px]">
              <label className="text-sm text-muted-foreground mb-1">
                Location
              </label>
              <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={locationOpen}
                    aria-haspopup="listbox"
                    className="w-full justify-between"
                  >
                    <span className="truncate">
                      {locationFilter || 'All Locations...'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full min-w-[100px] max-w-[300px] p-0 z-40 mt-2">
                  <Command>
                    <CommandInput placeholder="Search location..." />
                    <CommandList className="w-full h-full">
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup heading="Locations">
                        {availableLocations.map((loc) => (
                          <CommandItem
                            key={loc}
                            value={loc}
                            onSelect={() => {
                              setLocationFilter(loc);
                              setEmployerPrefs((prev) =>
                                prev
                                  ? { ...prev, location: loc }
                                  : { industry: '', location: loc, skills: '' },
                              );
                              setLocationOpen(false);
                            }}
                          >
                            {loc}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
          <h1 className="text-2xl font-bold">Statistics</h1>
          <Tabs
            defaultValue="practice"
            onValueChange={(value) =>
              setMode(value as 'interview' | 'practice')
            }
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="practice">Practice Statistics</TabsTrigger>
              <TabsTrigger value="interview">Interview Statistics</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Show Matches */}
          {employerPrefs && (
            <MatchedCandidatesView
              skillGapMessage={skillGapMessage}
              topThree={topThree}
              topProspect={topProspect}
              matched={matched}
              top3Worldwide={top3Worldwide}
              mode={mode}
              employersPrefs={employerPrefs}
            />
          )}
        </div>
      </TooltipProvider>
    );
}
