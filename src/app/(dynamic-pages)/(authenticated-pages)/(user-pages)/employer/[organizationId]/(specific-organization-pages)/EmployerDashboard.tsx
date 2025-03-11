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
  'All Skills',
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

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // We'll define a "mode" state: interview | practice
  const [mode, setMode] = useState<'interview' | 'practice'>('practice');
  // Employer preferences from a switcher
  // Multi-select filters: store as arrays.
  const [industryFilter, setIndustryFilter] =
    useState<string>('All Industries');
  const [skillFilter, setSkillFilter] = useState<string>('All Skills');
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
      if (mode === 'interview' && cand.interview_skill_stats == null) {
        return false;
      }
      if (mode === 'practice' && cand.practice_skill_stats == null) {
        return false;
      }
      return true;
    });

    // 2) If we want to filter by location + skill preference:
    filtered = filtered.filter((cand) => {
      if (!employerPrefs) {
        return false;
      }
      const locMatch = locationMatches(cand, employerPrefs.location);
      const skillMatch = hasPreferredSkill(cand, employerPrefs.skills);
      const industryMatch = industryMatches(cand, employerPrefs.industry);
      return locMatch && skillMatch && industryMatch;
    });

    // Industry multi-select: if any industry is selected and not "All Industries"
    if (industryFilter && !industryFilter.match('All Industries')) {
      filtered = filtered.filter((cand) => {
        return industryMatches(cand, industryFilter);
      });
    }

    // Skill multi-select: if any skill is selected and not "All Skills"
    if (skillFilter && !skillFilter.match('All Skills')) {
      filtered = filtered.filter((cand) => {
        return hasPreferredSkill(cand, skillFilter);
      });
    }

    if (employerPrefs) {
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
          `No candidates found for skill: ${employerPrefs.skills} in ${employerPrefs.industry}, located in ${employerPrefs.location}.`,
        );
      } else {
        setSkillGapMessage('');
      }

      // 3) Sort by highest average skill
      const sorted = filtered.slice().sort((a, b) => {
        return (
          getCandidateScoreAvgBySkill(b, employerPrefs.skills) -
          getCandidateScoreAvgBySkill(a, employerPrefs.skills)
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
          getCandidateScoreAvgBySkill(b, employerPrefs.skills) -
          getCandidateScoreAvgBySkill(a, employerPrefs.skills)
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

        if (stats) {
          stats.forEach((skill) => {
            if (skill.previous_avg != null) {
              totalDelta += skill.avg_score - skill.previous_avg;
              deltaCount += 1;
            }
          });
        }
      });

      if (deltaCount > 0) {
        setWeekDelta(totalDelta / deltaCount);
      } else {
        setWeekDelta(0);
      }
    }
  }, [mode, candidates, industryFilter, skillFilter, employerPrefs]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto min-h-screen">
        <h1 className="text-2xl font-bold">Employer Dashboard</h1>
        <LoadingSpinner />
      </div>
    );
  } else if (error) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto min-h-screen  ">
        <h1 className="text-2xl font-bold">Employer Dashboard</h1>
        <p className="text-red-500">{error}</p>
      </div>
    );
  } else
    return (
      <TooltipProvider>
        <div className="space-y-6 max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold">Employer Dashboard</h1>

          {employerPrefs && (
            <StatisticsView
              stats={stats}
              weekDelta={weekDelta}
              employerPrefs={employerPrefs}
            />
          )}
          <div className="flex justify-start text-center items-center gap-6">
            {/* Industry MultiSelect */}
            <div className="text-sm w-full text-slate-500">
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
                    className="w-[200px] justify-between"
                  >
                    {industryFilter ? industryFilter : 'All Industries...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full min-w-[200px] max-w-[300px] p-0 z-40 mt-2">
                  <Command>
                    <CommandInput placeholder="Search industry..." />
                    <CommandList className="">
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup heading="Industries">
                        {availableIndustries.map((industry) => (
                          <CommandItem
                            key={industry}
                            value={industry}
                            onSelect={(value) => {
                              setIndustryFilter(industry);
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
            <div className="text-sm text-slate-500 w-full">
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
                    className="w-[200px] justify-between"
                  >
                    {skillFilter ? skillFilter : 'All Skills...'}
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
                            onSelect={(value) => {
                              setSkillFilter(skill);
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
            <div className="text-center text-sm text-slate-500 w-full ">
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
                    className="w-[200px] justify-between"
                  >
                    {locationFilter ? locationFilter : 'All Locations...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full min-w-[100px] max-w-[300px] p-0 z-40 mt-2">
                  <Command>
                    <CommandInput placeholder="Search location..." />
                    <CommandList className="w-full h-full">
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup heading="Skills">
                        {availableLocations.map((loc) => (
                          <CommandItem
                            key={loc}
                            value={loc}
                            onSelect={(value) => {
                              setLocationFilter(loc);
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
          <h1 className="text-2xl font-bold">Candidate Statistics</h1>
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
