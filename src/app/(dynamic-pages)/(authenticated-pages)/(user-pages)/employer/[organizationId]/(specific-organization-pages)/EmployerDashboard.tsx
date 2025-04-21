/* eslint-disable no-irregular-whitespace */
'use client';

import { MatchedCandidatesView } from '@/components/Employee/Dashboard/MatchedCandidatesView';
import { ResumeMatchedCandidatesView } from '@/components/Employee/Dashboard/ResumeMatchedView';
import { FilterBar } from '@/components/FilterBar';
import { KeywordInput } from '@/components/KeywordInput';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Label } from '@/components/ui/label';
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
import {
  availableCountries,
  availableIndustries,
  availableRoles,
  availableSkills,
  experienceRanges,
} from '@/utils/filterOptions';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { MultiValueProps, components } from 'react-select';

// 1) curry the component so it captures maxVisible
const createLimitedMultiValue =
  (maxVisible: number) =>
    <Option,>(props: MultiValueProps<Option, true>) => {
      const { index, getValue } = props;
      const values = getValue();

      if (index >= maxVisible) return null;
      if (index === maxVisible - 1 && values.length > maxVisible) {
        return (
          <div className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
            {values.length - maxVisible} more
          </div>
        );
      }
      return <components.MultiValue {...props} />;
    };

function computeExperienceYears(startDate: string, endDate?: string | null) {
  const start = dayjs(startDate);
  const end = endDate ? dayjs(endDate) : dayjs(); // if endDate is null => "Present"
  return end.diff(start, 'year', true); // fractional years
}

export default function EmployerDashboard({
  organizationId,
}: {
  organizationId: string;
}) {
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

  /* ---------- performance filters --------------------- */
  const performanceFields = [
    {
      label: 'Role',
      placeholder: 'All Roles…',
      options: availableRoles,
      value: roleFilter,
      onChange: setRoleFilter,
    },
    {
      label: 'Industry',
      placeholder: 'All Industries…',
      options: availableIndustries,
      value: industryFilter,
      onChange: setIndustryFilter,
    },
    {
      label: 'Skill',
      placeholder: 'Select Skill…',
      options: availableSkills,
      value: skillFilter,
      onChange: setSkillFilter,
    },
    {
      label: 'Location',
      placeholder: 'All Locations…',
      options: availableCountries,
      value: locationFilter,
      onChange: setLocationFilter,
    },
  ];

  /* ---------- résumé filters -------------------------- */
  const resumeFields = [
    {
      label: 'Role',
      placeholder: 'All Roles…',
      options: availableRoles,
      value: resumeRoleFilter,
      onChange: setResumeRoleFilter,
    },
    {
      label: 'Location',
      placeholder: 'All Locations…',
      options: availableCountries,
      value: resumeLocationFilter,
      onChange: setResumeLocationFilter,
    },
    {
      label: 'Experience Range',
      placeholder: 'Experience Range',
      options: experienceRanges.map((r) => r.label),
      value: selectedExpRange?.label ?? 'Experience Range',
      onChange: (label: string) =>
        setSelectedExpRange(experienceRanges.find((r) => r.label === label)!),
    },
  ];

  // ========== Resume‑based filtering ==========
  useEffect(() => {
    if (matchView !== 'resume') {
      setMatchedByResume([]);
      return;
    }

    const filtered = candidates.filter((cand) => {
      /* 0. resume metadata guard ------------------------------------------- */
      if (!cand.resume_metadata) return false;
      const { skills = [], experiences = [] } = cand.resume_metadata;
      if (skills.length === 0 && experiences.length === 0) return false;

      // Keyword filter
      if (selectedResumeKeywords.length) {
        const searchable = skills.map((s) => s.toLowerCase());
        const blob = searchable.join(' ');

        const allPresent = selectedResumeKeywords.every((kw) => {
          const needle = kw.toLowerCase();
          return searchable.includes(needle) || blob.includes(needle);
        });

        if (!allPresent) return false;
      }

      // role and years of experience filters
      const needRole = resumeRoleFilter !== 'All Roles';
      const needYears =
        selectedExpRange && selectedExpRange.label !== 'All Experience';

      if (needRole || needYears) {
        if (experiences.length === 0) return false;

        /* rolePass: at least one jobTitle contains the chosen role */
        let rolePass = true;
        if (needRole) {
          rolePass = experiences.some((exp) =>
            exp.jobTitle
              ?.toLowerCase()
              .includes(resumeRoleFilter.toLowerCase()),
          );
        }

        // yearsPass: at least one experience matches the chosen range
        let yearsPass = true;
        if (needYears) {
          yearsPass = experiences.some((exp) => {
            if (!exp.startDate) return false;
            const yrs = computeExperienceYears(exp.startDate, exp.endDate);
            return yrs >= selectedExpRange!.min && yrs <= selectedExpRange!.max;
          });
        }

        if (!rolePass || !yearsPass) return false;
      }

      // Location filter
      if (
        resumeLocationFilter !== 'All Locations' &&
        !cand.country.includes(resumeLocationFilter) &&
        cand.country.toLowerCase() !== 'remote'
      ) {
        return false;
      }

      return true; // ✨ candidate passed every active sub‑filter
    });

    // Update the skill gap message if no candidates match the filters.
    if (filtered.length === 0) {
      setResumeSkillGapMessage(
        `No candidates found for Resume filters:
       Keywords: ${selectedResumeKeywords.join(', ') || '—'}
       Role: ${resumeRoleFilter}
       Location: ${resumeLocationFilter}
       Experience: ${selectedExpRange?.label ?? 'All'}`,
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

      if (roleFilter !== 'All Roles') {
        filtered = filtered.filter((cand) => cand.role.includes(roleFilter));
      }

      if (industryFilter !== 'All Industries') {
        filtered = filtered.filter((cand) =>
          cand.industry.includes(industryFilter),
        );
      }

      if (locationFilter !== 'All Locations') {
        filtered = filtered.filter(
          (cand) =>
            cand.country.includes(locationFilter) ||
            cand.country.toLowerCase() === 'remote',
        );
      }

      filtered = filtered.filter((cand) => {
        const stats =
          mode === 'interview'
            ? cand.interview_skill_stats
            : cand.practice_skill_stats;
        return stats?.some((s) => s.skill === skillFilter);
      });
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
              <FilterBar fields={performanceFields} />
              <h1 className="text-2xl font-bold">
                Matched Candidate Statistics
              </h1>
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
                  organizationId={organizationId}
                />
              )}
            </>
          ) : (
            // Resume Matches Filter Panel
            <>
              <div className="flex flex-wrap justify-start gap-2">
                <div className="flex flex-col text-sm text-slate-500 w-full sm:w-[350px]">
                  <label className="block text-sm mb-1">
                    Resume Skill Keywords
                  </label>
                  <KeywordInput
                    value={selectedResumeKeywords}
                    onChange={setSelectedResumeKeywords}
                    components={{
                      ...components,
                      MultiValue: createLimitedMultiValue(3),
                    }}
                  />
                </div>
                <FilterBar fields={resumeFields} />
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
