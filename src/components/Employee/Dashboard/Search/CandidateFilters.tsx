'use client';

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
import { ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

// Example data arrays
const defaultIndustries = [
  'All Industries',
  'Tech',
  'IT',
  'Finance',
  'Healthcare',
  'Education',
  'Retail',
];
const defaultSkills = [
  'All Skills',
  'Problem Solving',
  'Communication',
  'Leadership',
  'Teamwork',
];
const defaultLocations = [
  'All Locations',
  'Remote',
  'United States',
  'Canada',
  'United Kingdom',
];

type CandidateFiltersProps = {
  availableIndustries?: string[];
  availableSkills?: string[];
  availableLocations?: string[];
  industryValue?: string;
  skillValue?: string;
  locationValue?: string;
  minScoreValue?: number;
  searchQueryValue?: string;
  onChange: (filters: {
    industry: string;
    skill: string;
    location: string;
    minScore: number;
    searchQuery: string;
  }) => void;
};

export function CandidateFilters({
  availableIndustries = defaultIndustries,
  availableSkills = defaultSkills,
  availableLocations = defaultLocations,
  industryValue = 'All Industries',
  skillValue = 'All Skills',
  locationValue = 'All Locations',
  minScoreValue = 0,
  searchQueryValue = '',
  onChange,
}: CandidateFiltersProps) {
  // Local states for popover open status and filter values.
  const [industryOpen, setIndustryOpen] = useState(false);
  const [skillOpen, setSkillOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [minScore, setMinScore] = useState(minScoreValue);
  const [searchQuery, setSearchQuery] = useState(searchQueryValue);
  const [industry, setIndustry] = useState(industryValue);
  const [skill, setSkill] = useState(skillValue);
  const [location, setLocation] = useState(locationValue);

  return (
    <div className="flex flex-wrap gap-2">
      {/* Search Input */}
      <div className="flex flex-col text-sm text-slate-600 w-full sm:w-[300px]">
        <label className="text-muted-foreground mb-1">Search</label>
        <input
          type="text"
          className="border rounded-md p-2 w-full"
          placeholder="Search candidates..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            onChange({
              industry,
              skill,
              location,
              minScore,
              searchQuery: e.target.value,
            });
          }}
        />
      </div>

      {/* Industry Filter */}
      <div className="flex flex-col text-sm text-slate-600 w-full sm:w-[230px]">
        <label className="text-muted-foreground mb-1 block">Industry</label>
        <Popover open={industryOpen} onOpenChange={setIndustryOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={industryOpen}
              aria-haspopup="listbox"
              className="w-full justify-between"
            >
              <span className="truncate">{industry}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full min-w-[200px] max-w-[300px] p-0 z-40 mt-2">
            <Command>
              <CommandInput placeholder="Search industry..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Industries">
                  {availableIndustries.map((ind) => (
                    <CommandItem
                      key={ind}
                      value={ind}
                      onSelect={() => {
                        setIndustry(ind);
                        onChange({
                          industry: ind,
                          skill,
                          location,
                          minScore,
                          searchQuery,
                        });
                        setIndustryOpen(false);
                      }}
                    >
                      {ind}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Skill Filter */}
      <div className="flex flex-col text-sm text-slate-600 w-full sm:w-[230px]">
        <label className="text-muted-foreground mb-1 block">Skill</label>
        <Popover open={skillOpen} onOpenChange={setSkillOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={skillOpen}
              aria-haspopup="listbox"
              className="w-full justify-between"
            >
              <span className="truncate">{skill}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full min-w-[200px] max-w-[300px] p-0 z-40 mt-2">
            <Command>
              <CommandInput placeholder="Search skill..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Skills">
                  {availableSkills.map((sk) => (
                    <CommandItem
                      key={sk}
                      value={sk}
                      onSelect={() => {
                        setSkill(sk);
                        onChange({
                          industry,
                          skill: sk,
                          location,
                          minScore,
                          searchQuery,
                        });
                        setSkillOpen(false);
                      }}
                    >
                      {sk}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Location Filter */}
      <div className="flex flex-col text-sm text-slate-600 w-full sm:w-[230px]">
        <label className="text-muted-foreground mb-1 block">Location</label>
        <Popover open={locationOpen} onOpenChange={setLocationOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={locationOpen}
              aria-haspopup="listbox"
              className="w-full justify-between"
            >
              <span className="truncate">{location}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full min-w-[200px] max-w-[300px] p-0 z-40 mt-2">
            <Command>
              <CommandInput placeholder="Search location..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Locations">
                  {availableLocations.map((loc) => (
                    <CommandItem
                      key={loc}
                      value={loc}
                      onSelect={() => {
                        setLocation(loc);
                        onChange({
                          industry,
                          skill,
                          location: loc,
                          minScore,
                          searchQuery,
                        });
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

      {/* Min Score Input (only if a specific skill is chosen) */}
      {skill !== 'All Skills' && (
        <div className="flex flex-col text-sm text-slate-600 w-full sm:w-[100px]">
          <label className="text-muted-foreground mb-1">Min Score</label>
          <input
            type="number"
            className="border rounded-md p-2 w-full"
            value={minScore}
            min={0}
            max={100}
            onChange={(e) => {
              setMinScore(Number(e.target.value));
              onChange({
                industry,
                skill,
                location,
                minScore: Number(e.target.value),
                searchQuery,
              });
            }}
          />
        </div>
      )}
    </div>
  );
}
