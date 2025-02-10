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

export const InterviewHistoryFilter: React.FC<HistoryFilterProps> = ({
  activeTab,
  counts,
  onTabChange,
}) => {
  return (
    <>
    <span className="text-sm text-muted-foreground">
        {counts[activeTab.toLowerCase().replace(' ', '')] || 0} results
      </span>
      <Tabs
        defaultValue={activeTab}
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
