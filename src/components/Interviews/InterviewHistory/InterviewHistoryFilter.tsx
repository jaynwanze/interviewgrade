'use client';

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
  const tabs: {
    label: string;
    value: 'All' | 'Completed' | 'Not Completed' | 'Not Started';
    count: number;
  }[] = [
    { label: 'All Interviews', value: 'All', count: counts.all },
    { label: 'Completed', value: 'Completed', count: counts.completed },
    {
      label: 'Not Completed',
      value: 'Not Completed',
      count: counts.notCompleted,
    },
    { label: 'Not Started', value: 'Not Started', count: counts.notStarted },
  ];

  return (
    <div className="flex flex-wrap space-x-4 mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={`px-4 py-2 rounded ${
            activeTab === tab.value
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          } transition duration-200`}
          onClick={() => onTabChange(tab.value)}
        >
          {tab.label} ({tab.count})
        </button>
      ))}
    </div>
  );
};
