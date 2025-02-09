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
    <Tabs
      defaultValue={activeTab}
      onValueChange={(value) => onTabChange(value as typeof activeTab)}
      className="w-full"
    >
      <TabsList className="grid grid-cols-4 w-3/4 mx-auto">
        <TabsTrigger value="All">All ({counts.all})</TabsTrigger>
        <TabsTrigger value="Completed">
          Completed ({counts.completed})
        </TabsTrigger>
        <TabsTrigger value="Not Completed">
          Not Completed ({counts.notCompleted})
        </TabsTrigger>
        <TabsTrigger value="Not Started">
          Not Started ({counts.notStarted})
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
