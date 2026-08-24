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
        <div className="w-full overflow-x-auto pb-1 sm:overflow-visible sm:pb-0">
          <TabsList className="inline-flex h-auto min-w-max justify-start gap-1 p-1 sm:grid sm:w-full sm:min-w-0 sm:grid-cols-4">
            <TabsTrigger className="whitespace-nowrap px-3" value="All">
              All
            </TabsTrigger>
            <TabsTrigger className="whitespace-nowrap px-3" value="Completed">
              Completed
            </TabsTrigger>
            <TabsTrigger className="whitespace-nowrap px-3" value="Not Completed">
              Not Completed
            </TabsTrigger>
            <TabsTrigger className="whitespace-nowrap px-3" value="Not Started">
              Not Started
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
    </>
  );
};
