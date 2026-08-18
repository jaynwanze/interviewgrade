'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import React from 'react';

interface HistoryFilterProps {
  activeTab: 'All' | 'Completed' | 'Not Completed' | 'Not Started';
  counts: {
    all: number;
    completed: number;
    notCompleted: number;
    notStarted: number;
  };
  onTabChange: (
    tab: 'All' | 'Completed' | 'Not Completed' | 'Not Started',
  ) => void;
}

const countKeyByTab = {
  All: 'all',
  Completed: 'completed',
  'Not Completed': 'notCompleted',
  'Not Started': 'notStarted',
} as const;

export const InterviewHistoryFilter: React.FC<HistoryFilterProps> = ({
  activeTab,
  counts,
  onTabChange,
}) => {
  const countKey = countKeyByTab[activeTab];

  return (
    <>
      <span className="text-sm text-muted-foreground">
        {counts[countKey]} results
      </span>
      <Tabs
        value={activeTab}
        onValueChange={(value) => onTabChange(value as typeof activeTab)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 mx-auto">
          <TabsTrigger value="All">All</TabsTrigger>
          <TabsTrigger value="Completed">Completed</TabsTrigger>
          <TabsTrigger value="Not Completed">Not Completed</TabsTrigger>
          <TabsTrigger value="Not Started">Not Started</TabsTrigger>
        </TabsList>
      </Tabs>
    </>
  );
};
