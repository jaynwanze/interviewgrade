'use client';

import { FilterBar } from '@/components/FilterBar';
import { KeywordInput } from '@/components/KeywordInput';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCandidates } from '@/data/user/employee';
import { mockCandidates, type CandidateRow } from '@/types';
import {
  availableCountries,
  availableIndustries,
  availableRoles,
  availableSkills,
  experienceRanges,
} from '@/utils/filterOptions';
import dayjs from 'dayjs';
import { Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

// helper to compute experience years
type ExpRange = { label: string; min: number; max: number };
function computeYears(start: string, end?: string | null) {
  const s = dayjs(start);
  const e = end ? dayjs(end) : dayjs();
  return e.diff(s, 'year', true);
}

export default function CandidatesListPage({ organizationId }) {
  const router = useRouter();

  // raw data
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI & filters
  type Filters = {
    industry: string;
    role: string;
    skill: string;
    location: string;
    minScore: number;
    search: string;
    keywords: string[];
    resumeRole: string;
    resumeLoc: string;
    resumeExp: ExpRange;
  };
  const [filterView, setFilterView] = useState<'performance' | 'resume'>(
    'performance',
  );
  const [mode, setMode] = useState<'practice' | 'interview'>('practice');
  const [filters, setFilters] = useState<Filters>({
    industry: 'All Industries',
    role: 'All Roles',
    skill: 'All Skills',
    location: 'All Locations',
    minScore: 0,
    search: '',
    keywords: [],
    resumeRole: 'All Roles',
    resumeLoc: 'All Locations',
    resumeExp: experienceRanges[0],
  });

  // pagination
  const pageSize = 10;
  const [page, setPage] = useState(1);

  // fetch candidates
  useEffect(() => {
    getCandidates()
      .then((data) => setCandidates(data.concat(mockCandidates)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // compute filtered list
  const filtered = useMemo(() => {
    if (loading || error) return [];
    return candidates.filter((c) => {
      // global search
      const hay = (c.full_name + c.role + c.industry).toLowerCase();
      if (filters.search && !hay.includes(filters.search.toLowerCase()))
        return false;

      if (filterView === 'performance') {
        const stats =
          mode === 'practice'
            ? c.practice_skill_stats
            : c.interview_skill_stats;
        if (!stats?.length) return false;
        if (
          filters.industry !== 'All Industries' &&
          !c.industry.includes(filters.industry)
        )
          return false;
        if (filters.role !== 'All Roles' && !c.role.includes(filters.role))
          return false;
        if (
          filters.location !== 'All Locations' &&
          !c.country.includes(filters.location) &&
          c.country.toLowerCase() !== 'remote'
        )
          return false;
        if (filters.skill !== 'All Skills') {
          const s = stats.find((s) => s.skill === filters.skill);
          if (!s || s.avg_score < filters.minScore) return false;
        }
      } else {
        const meta = c.resume_metadata;
        if (!meta) return false;
        if (filters.keywords.length) {
          const blob = meta.skills.map((s) => s.toLowerCase()).join(' ');
          if (!filters.keywords.every((k) => blob.includes(k.toLowerCase())))
            return false;
        }
        if (filters.resumeRole !== 'All Roles') {
          if (
            !meta.experiences.some((e) =>
              e.jobTitle
                ?.toLowerCase()
                .includes(filters.resumeRole.toLowerCase()),
            )
          )
            return false;
        }
        if (filters.resumeExp.label !== 'All Experience') {
          if (
            !meta.experiences.some((e) => {
              if (!e.startDate) return false;
              const yrs = computeYears(e.startDate, e.endDate);
              return (
                yrs >= filters.resumeExp.min && yrs <= filters.resumeExp.max
              );
            })
          )
            return false;
        }
        if (
          filters.resumeLoc !== 'All Locations' &&
          !c.country.includes(filters.resumeLoc) &&
          c.country.toLowerCase() !== 'remote'
        )
          return false;
      }
      return true;
    });
  }, [candidates, loading, error, filters, filterView, mode]);

  // whenever filter criteria change, reset to first page
  useEffect(() => {
    setPage(1);
  }, [filtered, filterView, mode, filters]);

  // slice out current page
  const pageCount = Math.ceil(filtered.length / pageSize);
  const startIdx = (page - 1) * pageSize;
  const currentPageItems = filtered.slice(startIdx, startIdx + pageSize);

  // helpers for columns
  function getTopSkill(c) {
    const stats =
      mode === 'practice' ? c.practice_skill_stats : c.interview_skill_stats;
    if (!stats?.length) return null;
    return stats.reduce(
      (best, s) => (s.avg_score > best.avg_score ? s : best),
      stats[0],
    );
  }
  function getKeywordCount(c) {
    const skills = c.resume_metadata?.skills ?? [];
    return skills.filter((s) =>
      filters.keywords.map((k) => k.toLowerCase()).includes(s.toLowerCase()),
    ).length;
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <span className="space-y-2">
        <h1 className="text-2xl font-bold text-center">Candidate Search</h1>
        <p className="text-center text-muted-foreground">
          Search and filter candidates based on their performance or resume
          keywords.
        </p>
      </span>
      <Separator className="my-4" />
      {/* Search + toggle */}
      <div className="space-y-6">
        <div className="flex justify-between items-end space-x-3">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-sm text-muted-foreground">Search</Label>
            <Input
              placeholder="Search by name, job or industry…"
              className="w-full"
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  search: e.target.value,
                }))
              }
            />
          </div>
          <div className="flex items-center space-x-2 p-2">
            <Switch
              checked={filterView === 'performance'}
              onCheckedChange={() =>
                setFilterView((fv) =>
                  fv === 'performance' ? 'resume' : 'performance',
                )
              }
            />
            <Label className="text-sm">
              {filterView === 'performance'
                ? 'Performance Filter'
                : 'Resume Filter'}
            </Label>
          </div>
        </div>

        {/* Resume keywords */}
        {filterView === 'resume' && (
          <div className="flex-1 min-w-[200px]">
            <Label className="text-sm text-muted-foreground">
              Resume Skill Keywords
            </Label>
            <KeywordInput
              value={filters.keywords}
              onChange={(ks) => setFilters((f) => ({ ...f, keywords: ks }))}
            />
          </div>
        )}

        {/* Filter bar */}
        <FilterBar
          fields={
            filterView === 'performance'
              ? [
                {
                  label: 'Role',
                  placeholder: 'All Roles…',
                  options: availableRoles,
                  value: filters.role,
                  onChange: (v) => setFilters((f) => ({ ...f, role: v })),
                },
                {
                  label: 'Industry',
                  placeholder: 'All Industries…',
                  options: availableIndustries,
                  value: filters.industry,
                  onChange: (v) => setFilters((f) => ({ ...f, industry: v })),
                },
                {
                  label: 'Skill',
                  placeholder: 'All Skills…',
                  options: availableSkills,
                  value: filters.skill,
                  onChange: (v) => setFilters((f) => ({ ...f, skill: v })),
                },
                {
                  label: 'Location',
                  placeholder: 'All Locations…',
                  options: availableCountries,
                  value: filters.location,
                  onChange: (v) => setFilters((f) => ({ ...f, location: v })),
                },
              ]
              : [
                {
                  label: 'Role',
                  placeholder: 'All Roles…',
                  options: availableRoles,
                  value: filters.resumeRole,
                  onChange: (v) =>
                    setFilters((f) => ({ ...f, resumeRole: v })),
                },
                {
                  label: 'Location',
                  placeholder: 'All Locations…',
                  options: availableCountries,
                  value: filters.resumeLoc,
                  onChange: (v) =>
                    setFilters((f) => ({ ...f, resumeLoc: v })),
                },
                {
                  label: 'Experience',
                  placeholder: 'All Experience…',
                  options: experienceRanges.map((r) => r.label),
                  value: filters.resumeExp.label,
                  onChange: (lbl) => {
                    const rng = experienceRanges.find(
                      (r) => r.label === lbl,
                    )!;
                    setFilters((f) => ({ ...f, resumeExp: rng }));
                  },
                },
              ]
          }
        />

        {/* performance-tabs */}
        {filterView === 'performance' && (
          <Tabs
            defaultValue="practice"
            onValueChange={(v) => setMode(v as 'practice' | 'interview')}
          >
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="practice">Practice Statistics</TabsTrigger>
              <TabsTrigger value="interview">Interview Statistics</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* results table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>
                {filterView === 'performance'
                  ? 'Top Skill'
                  : 'Keywords Matched'}
              </TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPageItems.map((c) => {
              const top = filterView === 'performance' ? getTopSkill(c) : null;
              const kwCount = filterView === 'resume' ? getKeywordCount(c) : 0;
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={c.avatar_url} alt={c.full_name} />
                        <AvatarFallback>
                          {c.full_name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      {c.full_name}
                    </div>
                  </TableCell>
                  <TableCell>{c.role}</TableCell>
                  <TableCell>
                    {c.city}, {c.country}
                  </TableCell>
                  <TableCell>{c.industry}</TableCell>
                  <TableCell>
                    {filterView === 'performance' && top ? (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Star className="h-4 w-4 text-yellow-500" /> {top.skill}
                      </Badge>
                    ) : filterView === 'resume' ? (
                      <Badge variant="outline">
                        {kwCount} / {filters.keywords.length}
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="link"
                      onClick={() =>
                        router.push(`/employer/${organizationId}/c/${c.id}`)
                      }
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* pagination controls */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">
              Showing {startIdx + 1}–
              {Math.min(startIdx + pageSize, filtered.length)} of{' '}
              {filtered.length}
            </span>
            <div className="space-x-2">
              <Button
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                disabled={page === pageCount}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <p className="text-center text-gray-500 mt-4">No candidates found.</p>
        )}
      </div>
    </div>
  );
}
