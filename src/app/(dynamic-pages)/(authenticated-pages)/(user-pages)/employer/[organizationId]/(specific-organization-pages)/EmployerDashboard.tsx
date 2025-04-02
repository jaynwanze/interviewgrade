'use client';

import { MatchedCandidatesView } from '@/components/Employee/Dashboard/MatchedCandidatesView';
import { ResumeMatchedCandidatesView } from '@/components/Employee/Dashboard/ResumeMatchedView';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { MultiSelect } from '@/components/MultiSelect';
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
import dayjs from 'dayjs'; // or date-fns for experience calculation
import { ChevronsUpDown } from 'lucide-react';
import { useEffect, useState } from 'react';

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
];

const experienceRanges = [
  { label: 'All Experience', min: 0, max: 999 },
  { label: '0-1 year', min: 0, max: 1 },
  { label: '2-4 years', min: 2, max: 4 },
  { label: '5-7 years', min: 5, max: 7 },
  { label: '8+ years', min: 8, max: 99 }, // or some large upper bound
];
function computeExperienceYears(startDate: string, endDate?: string | null) {
  const start = dayjs(startDate);
  const end = endDate ? dayjs(endDate) : dayjs(); // if endDate is null => "Present"
  return end.diff(start, 'year', true); // fractional years
}

export default function EmployerDashboard() {
  // Core stats
  const [stats] = useState({
    tokensLeft: 5,
    incomingPipeline: 2,
    unlockedCandidates: 5,
  });

  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
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

  // Mode for interview/practice
  const [mode, setMode] = useState<'interview' | 'practice'>('practice');

  // Performance filters.
  const [industryFilter, setIndustryFilter] =
    useState<string>('All Industries');
  const [skillFilter, setSkillFilter] = useState<string>('Select Skill');
  const [locationFilter, setLocationFilter] = useState<string>('All Locations');
  const [roleFilter, setRoleFilter] = useState<string>('All Roles');

  // New filter for resume keywords (for resume matching view).
  const [selectedResumeKeywords, setSelectedResumeKeywords] = useState<
    string[]
  >([]);
  const [matchedByResume, setMatchedByResume] = useState<CandidateRow[]>([]);
  const [resumeSkillGapMessage, setResumeSkillGapMessage] =
    useState<string>('');
  const [resumeRoleFilter, setResumeRoleFilter] = useState<string>('All Roles');
  const [resumeLocationFilter, setResumeLocationFilter] =
    useState<string>('All Locations');
  const [selectedExpRange, setSelectedExpRange] = useState<{
    label: string;
    min: number;
    max: number;
  } | null>(null);
  const [experienceBracketOpen, setExperienceBracketOpen] =
    useState<boolean>(false);

  //  State: which matching view is active: "performance" or "resume".
  const [matchView, setMatchView] = useState<'performance' | 'resume'>(
    'performance',
  );

  // Popover states for existing filters.
  const [industryOpen, setIndustryOpen] = useState(false);
  const [skillOpen, setSkillOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);

  // Popover states for resume filters.
  const [resumeRoleOpen, setResumeRoleOpen] = useState(false);
  const [resumeLocationOpen, setResumeLocationOpen] = useState(false);

  // ========== Resume-based filtering ==========
  useEffect(() => {
    if (matchView !== 'resume') {
      setMatchedByResume([]);
      return;
    }
    let filtered: CandidateRow[] = [];

    filtered = candidates.filter((cand) => {
      if (!cand.resume_metadata) return false;

      // If no keywords or fields selected, we skip for now
      // (Alternatively, you could show all candidates who have resume_metadata.)
      const { skills, experiences } = cand.resume_metadata;
      if (!skills && !experiences) return false;

      // Keywords
      if (selectedResumeKeywords.length > 0) {
        if (!skills) return false;
        const lowerSkills = skills.map((s) => s.toLowerCase());
        // At least one selected keyword must appear in the candidate's resume skills
        const hasKeyword = selectedResumeKeywords.some((kw) =>
          lowerSkills.includes(kw.toLowerCase()),
        );
        if (!hasKeyword) return false;
      }
      // Role + bracket
      const isFilteringExperience =
        resumeRoleFilter !== 'All Roles' ||
        (selectedExpRange && selectedExpRange.label !== 'All Experience');

      if (isFilteringExperience) {
        if (!experiences || experiences.length === 0) {
          return false; // no experiences => can't match
        }
        // We want at least one experience that satisfies both
        const hasExp = experiences.some((exp) => {
          // a) Role check
          if (resumeRoleFilter !== 'All Roles') {
            if (
              !exp.jobTitle
                ?.toLowerCase()
                .includes(resumeRoleFilter.toLowerCase())
            ) {
              return false;
            }
          }
          // b) Bracket check
          if (selectedExpRange && selectedExpRange.label !== 'All Experience') {
            if (!exp.startDate) return false;
            const years = computeExperienceYears(exp.startDate, exp.endDate);
            if (years < selectedExpRange.min || years > selectedExpRange.max) {
              return false;
            }
          }
          return true;
        });
        if (!hasExp) return false;
      }

      // Filter by location if not "All Locations"
      if (
        resumeLocationFilter !== 'All Locations' &&
        !cand.country.includes(resumeLocationFilter) &&
        cand.country.toLowerCase() !== 'remote'
      ) {
        return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      setResumeSkillGapMessage(
        `No candidates found for Resume filters:
          Keywords: ${selectedResumeKeywords.join(', ')}
          Role: ${resumeRoleFilter}
          Location: ${resumeLocationFilter}
          Min Years Exp: ${selectedExpRange ? selectedExpRange.label : 'N/A'}`,
      );
    } else {
      setResumeSkillGapMessage('');
    }
    setMatchedByResume(filtered);
  }, [
    matchView,
    candidates,
    selectedResumeKeywords,
    resumeRoleFilter,
    resumeLocationFilter,
    selectedExpRange,
  ]);

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
          setRoleFilter(prefs.job || 'All Roles');
          setResumeRoleFilter(prefs.job || 'All Roles');
          setResumeLocationFilter(prefs.location || 'All Locations');
          setSelectedExpRange({ label: 'All Experience', min: 0, max: 999 });
          setDidSetFilters(true);
        }
        const fetchedCandidates = await getCandidates();
        setCandidates(fetchedCandidates.concat(mockCandidates));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper: Compute candidate's average score by skill.
  function getCandidateScoreAvgBySkill(
    candidate: CandidateRow,
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
    let filtered: CandidateRow[] = [];

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
    }
    if (filtered.length === 0) {
      setSkillGapMessage(
        `No candidates found for your selected filters. Industry: ${industryFilter}, Skill: ${skillFilter}, Location: ${locationFilter}, Role: ${roleFilter}`,
      );
    } else {
      setSkillGapMessage('');
    }

    // For sorting, we'll simply use the performance score if in performance mode;
    // in resume mode, we might sort alphabetically by name.
    let sorted: CandidateRow[] = [];
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

    // // Global ranking (optional) remains based on performance.
    // const globalCandidates = candidates.filter((cand) => {
    //   const stats =
    //     mode === 'interview'
    //       ? cand.interview_skill_stats
    //       : cand.practice_skill_stats;
    //   return stats && stats.length > 0;
    // });
    // const skillToSortBy = skillFilter || employerPrefs?.skills || '';
    // const globalSorted = globalCandidates.slice().sort((a, b) => {
    //   return (
    //     getCandidateScoreAvgBySkill(b, skillToSortBy) -
    //     getCandidateScoreAvgBySkill(a, skillToSortBy)
    //   );
    // });
    // setTop3Worldwide(globalSorted.slice(0, 3));

    // // Compute weekDelta (example).
    // let totalDelta = 0;
    // let deltaCount = 0;
    // candidates.forEach((cand) => {
    //   const stats =
    //     mode === 'interview'
    //       ? cand.interview_skill_stats
    //       : cand.practice_skill_stats;
    //   if (stats) {
    //     stats.forEach((skill) => {
    //       if (skill.previous_avg != null) {
    //         totalDelta += skill.avg_score - skill.previous_avg;
    //         deltaCount += 1;
    //       }
    //     });
    //   }
    // });
    // setWeekDelta(deltaCount > 0 ? totalDelta / deltaCount : 0);
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
            <>
              <div className="flex flex-wrap justify-start gap-2">
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
              <h1 className="text-2xl font-bold">Statistics</h1>
              <Tabs
                defaultValue="practice"
                onValueChange={(value) =>
                  setMode(value as 'interview' | 'practice')
                }
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="practice">
                    Practice Statistics
                  </TabsTrigger>
                  <TabsTrigger value="interview">
                    Interview Statistics
                  </TabsTrigger>
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
            </>
          ) : (
            // Resume Matches Filter Panel
            <>
              <div className="flex flex-wrap justify-start gap-2">
                <div className="flex flex-col text-sm text-slate-500 w-full sm:w-[350px]">
                  {/* Resume Keywords Multi-Select */}
                  <label className="block text-sm mb-1">Resume Keywords</label>
                  <MultiSelect
                    options={availableResumeKeywords}
                    defaultValue={[]}
                    onValueChange={(values: string[]) =>
                      setSelectedResumeKeywords(values)
                    }
                    placeholder="Select resume keywords"
                    variant="inverted"
                    maxCount={2}
                  />
                </div>

                {/* Desired Role */}
                <div className="flex flex-col text-sm text-slate-500 w-full sm:w-[200px]">
                  <label className="text-sm text-muted-foreground mb-1">
                    Role
                  </label>
                  <Popover
                    open={resumeRoleOpen}
                    onOpenChange={setResumeRoleOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={resumeRoleOpen}
                        aria-haspopup="listbox"
                        className="w-full justify-between"
                      >
                        <span className="truncate">
                          {resumeRoleFilter || 'All Roles...'}
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
                                  setResumeRoleFilter(role);
                                  setResumeRoleOpen(false);
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

                {/* Location */}
                <div className="flex flex-col text-sm text-slate-500 w-full sm:w-[200px]">
                  <label className="text-sm text-muted-foreground mb-1">
                    Location
                  </label>
                  <Popover
                    open={resumeLocationOpen}
                    onOpenChange={setResumeLocationOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={resumeLocationOpen}
                        aria-haspopup="listbox"
                        className="w-full justify-between"
                      >
                        <span className="truncate">
                          {resumeLocationFilter || 'All Locations...'}
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
                                  setResumeLocationFilter(loc);
                                  setResumeLocationOpen(false);
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

                {/* Min Years of Experience */}
                <div className="flex flex-col text-sm text-slate-500 w-full sm:w-[200px]">
                  <label className="text-sm text-muted-foreground mb-1">
                    Min Years Experience
                  </label>
                  <Popover
                    open={experienceBracketOpen}
                    onOpenChange={setExperienceBracketOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={experienceBracketOpen}
                        aria-haspopup="listbox"
                        className="w-full justify-between"
                      >
                        <span className="truncate">
                          {selectedExpRange
                            ? selectedExpRange.label
                            : 'Experience Range'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full min-w-[100px] max-w-[300px] p-0 z-40 mt-2">
                      <Command>
                        <CommandInput placeholder="Search experience bracket..." />
                        <CommandList>
                          <CommandEmpty>No results found.</CommandEmpty>
                          <CommandGroup heading="Experience Ranges">
                            {experienceRanges.map((range) => (
                              <CommandItem
                                key={range.label}
                                value={range.label}
                                onSelect={() => {
                                  setSelectedExpRange(range);
                                  setExperienceBracketOpen(false);
                                }}
                              >
                                {range.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {employerPrefs && (
                <ResumeMatchedCandidatesView
                  matchedByResume={matchedByResume}
                  skillGapMessage={resumeSkillGapMessage}
                  selectedKeywords={selectedResumeKeywords}
                  employerPrefs={employerPrefs}
                />
              )}
            </>
          )}
        </div>
      </TooltipProvider>
    );
}
