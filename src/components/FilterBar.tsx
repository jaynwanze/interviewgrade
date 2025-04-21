// ui/FilterBar.tsx
'use client';
import React from 'react';
import { FilterSelect, FilterSelectProps } from './FilterSelect';

interface FilterBarProps {
  fields: FilterSelectProps[];
}

export const FilterBar: React.FC<FilterBarProps> = ({ fields }) => (
  <div className="flex flex-wrap justify-start gap-2">
    {fields.map((f) => (
      <FilterSelect key={f.label} {...f} />
    ))}
  </div>
);
