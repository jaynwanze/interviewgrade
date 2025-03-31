'use client';

import { MatchedCandidatesView } from '@/components/Employee/Dashboard/MatchedCandidatesView';
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
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
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
import Select from 'react-select';

// Existing filters options.
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

const availableRoles = [
  'All Roles',
  'Software Engineer',
  'Data Scientist',
  'Product Manager',
  'UX Designer',
  'Marketing Specialist',
  'Sales Executive',
  'HR Manager',
  'Customer Support',
  'Project Manager',
  'Business Analyst',
  'DevOps Engineer',
  'Web Developer',
  'Mobile Developer',
  'Cybersecurity Analyst',
  'Game Developer',
];

// Define available resume keywords options for the resume view.
const availableResumeKeywords = [
  { value: 'Python', label: 'Python' },
  { value: 'JavaScript', label: 'JavaScript' },
  { value: 'React', label: 'React' },
  { value: 'SQL', label: 'SQL' },
  { value: 'Java', label: 'Java' },
  { value: 'Typescript', label: 'Typescript' },
  { value: 'C++', label: 'C++' },
  { value: 'Docker', label: 'Docker' },
  { value: 'Jenkins', label: 'Jenkins' },
  { value: 'GitHub Actions', label: 'GitHub Actions' },
  { value: 'Cypress', label: 'Cypress' },
  { value: 'Selenium', label: 'Selenium' },
  // Add more keywords as needed.
];

// Extend CandidateRow to include resumeMetadata (if available).
interface Candidate extends CandidateRow {
  resumeMetadata?: {
    skills?: string[];
    // Additional resume metadata fields can be added here.
  };
}

export default function EmployerDashboard() {
  // Core stats
  const [stats] = useState({
    tokensLeft: 5,
    incomingPipeline: 2,
    unlockedCandidates: 5,
  });

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [matched, setMatched] = useState<Candidate[]>([]);
  const [topThree, setTopThree] = useState<Candidate[]>([]);
  const [topProspect, setTopProspect] = useState<Candidate | null>(null);
  const [skillGapMessage, setSkillGapMessage] = useState('');
  const [weekDelta, setWeekDelta] = useState<number>(0);
  const [top3Worldwide, setTop3Worldwide] = useState<Candidate[]>([]);
  const [employerPrefs, setEmployerPrefs] =
    useState<EmployerCandidatePreferences | null>(null);
  const [didSetFilters, setDidSetFilters] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Mode for interview/practice
  const [mode, setMode] = useState<'interview' | 'practice'>('practice');

  // Existing filters.
  const [industryFilter, setIndustryFilter] =
    useState<string>('All Industries');
  const [skillFilter, setSkillFilter] = useState<string>('Select Skill');
  const [locationFilter, setLocationFilter] = useState<string>('All Locations');
  const [roleFilter, setRoleFilter] = useState<string>('All Roles');

  // New filter for resume keywords (for resume matching view).
  const [selectedResumeKeywords, setSelectedResumeKeywords] = useState<
    string[]
  >([]);

  // New state: which matching view is active: "performance" or "resume".
  const [matchView, setMatchView] = useState<'performance' | 'resume'>(
    'performance',
  );

  // Popover states for existing filters.
  const [industryOpen, setIndustryOpen] = useState(false);
  const [skillOpen, setSkillOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);

  // Fetch initial data.
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const prefs = await getEmployerCandidatePreferences();
        setEmployerPrefs(prefs);
        if (prefs && !didSetFilters) {
          setIndustryFilter(prefs.industry || 'All Industries');
          setSkillFilter(prefs.skills || 'Select Skill');
          setLocationFilter(prefs.location || 'All Locations');
          setDidSetFilters(true);
        }
        const fetchedCandidates = await getCandidates();
        setCandidates(fetchedCandidates.concat(mockCandidates));
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper: Compute candidate's average score by skill.
  function getCandidateScoreAvgBySkill(
    candidate: Candidate,
    skill: string,
  ): number {
    const { interview_skill_stats, practice_skill_stats } = candidate;
    const stats =
      mode === 'interview' ? interview_skill_stats : practice_skill_stats;
    if (!stats || stats.length === 0) return 0;
    const skillStats = stats.find((s) => s.skill === skill);
    return skillStats ? skillStats.avg_score : 0;
  }

  // Main filtering useEffect.
  useEffect(() => {
    let filtered: Candidate[] = [];

    if (matchView === 'performance') {
      // Use existing performance-based filtering.
      filtered = candidates.filter((cand) => {
        if (mode === 'interview' && !cand.interview_skill_stats) return false;
        if (mode === 'practice' && !cand.practice_skill_stats) return false;
        return true;
      });

      if (industryFilter !== 'All Industries') {
        filtered = filtered.filter((cand) =>
          cand.industry.includes(industryFilter),
        );
      }

      filtered = filtered.filter((cand) => {
        const stats =
          mode === 'interview'
            ? cand.interview_skill_stats
            : cand.practice_skill_stats;
        return stats?.some((s) => s.skill === skillFilter);
      });

      if (locationFilter !== 'All Locations') {
        filtered = filtered.filter(
          (cand) =>
            cand.country.includes(locationFilter) ||
            cand.country.toLowerCase() === 'remote',
        );
      }

      if (roleFilter !== 'All Roles') {
        filtered = filtered.filter((cand) => cand.role.includes(roleFilter));
      }
    } else if (matchView === 'resume') {
      // Use resume-based filtering.
      // Filter candidates that have resume metadata and (if keywords are selected) match them.
      filtered = candidates.filter((cand) => {
        if (!cand.resumeMetadata || !cand.resumeMetadata.skills) return false;
        // If no keywords selected, include candidate.
        if (selectedResumeKeywords.length === 0) return true;
        const candidateKeywords = cand.resumeMetadata.skills.map((s) =>
          s.toLowerCase(),
        );
        return selectedResumeKeywords.some((keyword) =>
          candidateKeywords.includes(keyword.toLowerCase()),
        );
      });
    }

    if (filtered.length === 0) {
      setSkillGapMessage(
        `No candidates found for your selected filters.
        ${matchView === 'performance'
          ? `Industry: ${industryFilter}, Skill: ${skillFilter}, Location: ${locationFilter}, Role: ${roleFilter}`
          : `Resume Keywords: ${selectedResumeKeywords.join(', ')}`
        }`,
      );
    } else {
      setSkillGapMessage('');
    }

    // For sorting, we'll simply use the performance score if in performance mode;
    // in resume mode, we might sort alphabetically by name.
    let sorted: Candidate[] = [];
    if (matchView === 'performance') {
      const skillToSortBy = skillFilter || employerPrefs?.skills || '';
      sorted = filtered.slice().sort((a, b) => {
        return (
          getCandidateScoreAvgBySkill(b, skillToSortBy) -
          getCandidateScoreAvgBySkill(a, skillToSortBy)
        );
      });
    } else {
      sorted = filtered
        .slice()
        .sort((a, b) => a.full_name.localeCompare(b.full_name));
    }

    setMatched(sorted);
    setTopThree(sorted.slice(0, 3));
    setTopProspect(sorted.length > 0 ? sorted[0] : null);

    // Global ranking (optional) remains based on performance.
    const globalCandidates = candidates.filter((cand) => {
      const stats =
        mode === 'interview'
          ? cand.interview_skill_stats
          : cand.practice_skill_stats;
      return stats && stats.length > 0;
    });
    const skillToSortBy = skillFilter || employerPrefs?.skills || '';
    const globalSorted = globalCandidates.slice().sort((a, b) => {
      return (
        getCandidateScoreAvgBySkill(b, skillToSortBy) -
        getCandidateScoreAvgBySkill(a, skillToSortBy)
      );
    });
    setTop3Worldwide(globalSorted.slice(0, 3));

    // Compute weekDelta (example).
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
    roleFilter,
    employerPrefs,
    selectedResumeKeywords,
    matchView,
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
      <div className="space-y-6 max-w-5xl mx-auto min-h-screen">
        <h1 className="text-2xl font-bold">Candidate Dashboard</h1>
        <p className="text-red-500">{error}</p>
      </div>
    );
  } else
    return (
      <TooltipProvider>
        <div className="space-y-6 max-w-5xl mx-auto">
          <div className="flex justify-between mb-4 relative">
            <h1 className="text-2xl font-bold">Candidate Dashboard</h1>
            <span className="flex justify-center space-x-2 items-center text-sm">
              <Label htmlFor="filter-mode">
                {matchView === 'performance'
                  ? 'Performance Filter'
                  : 'Resume Filter'}
              </Label>
              <Switch
                id="filter-mode"
                checked={matchView === 'performance'}
                onCheckedChange={() =>
                  setMatchView((prev) =>
                    prev === 'performance' ? 'resume' : 'performance',
                  )
                }
              />
            </span>
          </div>

          {/* Show different filter panels based on matchView */}
          {matchView === 'performance' ? (
            <div className="flex flex-wrap justify-start gap-2">
              {/* Existing filters for performance matching */}
              {/* Role MultiSelect */}
              <div className="flex flex-col text-sm text-slate-500 w-full sm:w-[200px]">
                <label className="text-sm text-muted-foreground mb-1">
                  Role
                </label>
                <Popover open={roleOpen} onOpenChange={setRoleOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={roleOpen}
                      aria-haspopup="listbox"
                      className="w-full justify-between"
                    >
                      <span className="truncate">
                        {roleFilter || 'All Roles...'}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full min-w-[200px] max-w-[300px] p-0 z-40 mt-2">
                    <Command>
                      <CommandInput placeholder="Search role..." />
                      <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup heading="Roles">
                          {availableRoles.map((role) => (
                            <CommandItem
                              key={role}
                              value={role}
                              onSelect={() => {
                                setRoleFilter(role);
                                setEmployerPrefs((prev) =>
                                  prev
                                    ? { ...prev, role: role }
                                    : {
                                      job: role,
                                      industry: '',
                                      location: '',
                                      skills: '',
                                    },
                                );
                                setRoleOpen(false);
                              }}
                            >
                              {role}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
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
                                      job: '',
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
                                      job: '',
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
                                    : {
                                      industry: '',
                                      location: loc,
                                      skills: '',
                                      job: '',
                                    },
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
            </div>
          ) : (
            // Resume Matches Filter Panel: Only display the Resume Keywords filter.
            <div className="w-full sm:w-[300px]">
              <label className="block text-sm mb-1">Resume Keywords</label>
              <Select
                options={availableResumeKeywords}
                isMulti
                onChange={(selectedOptions) =>
                  setSelectedResumeKeywords(
                    selectedOptions.map((opt) => opt.value),
                  )
                }
                placeholder="Select resume keywords..."
              />
            </div>
          )}

          {/* TABS for Interview/Practice Mode */}
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

          {/* Render Matches */}
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
