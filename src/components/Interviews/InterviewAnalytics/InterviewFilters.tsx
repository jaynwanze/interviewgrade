'use client';
import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { InterviewSearchBar } from './InterviewSearchBar';

interface Filters {
  dateRange: { start: string; end: string };
  interview_title: string;
  searchQuery: string;
}
interface FiltersProps {
  filters: Filters;
  onFilterChange: (newFilters: Partial<Filters>) => void;
}

export const InterviewFilters: React.FC<FiltersProps> = ({
  filters,
  onFilterChange,
}) => {
  const [startDate, setStartDate] = useState<Date | null>(
    filters.dateRange.start ? new Date(filters.dateRange.start) : null,
  );
  const [endDate, setEndDate] = useState<Date | null>(
    filters.dateRange.end ? new Date(filters.dateRange.end) : null,
  );
  const [interviewTitle, setInterviewTitle] = useState<string>(
    filters.interview_title,
  );

  useEffect(() => {
    const newFilters = {
      dateRange: {
        start: startDate ? startDate.toISOString().split('T')[0] : '',
        end: endDate ? endDate.toISOString().split('T')[0] : '',
      },
      interview_title: interviewTitle,
    };

    // Only call onFilterChange if the filters have actually changed
    if (
      newFilters.dateRange.start !== filters.dateRange.start ||
      newFilters.dateRange.end !== filters.dateRange.end ||
      newFilters.interview_title !== filters.interview_title
    ) {
      onFilterChange(newFilters);
    }
  }, [startDate, endDate, interviewTitle, filters, onFilterChange]);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setInterviewTitle(e.target.value);
  };

  return (
    <div className="">
      {/* Date Range Picker */}
      <div className="items-center space-x-2 mb-5 dark:bg:gray-900">
        <label className="font-medium">Date Range:</label>
        <DatePicker
          className="dark:bg-gray-600"
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          selectsStart
          startDate={startDate as Date}
          endDate={endDate as Date}
          placeholderText="Start Date"
        />
        <DatePicker
          className="dark:bg-gray-600"
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          selectsEnd
          startDate={startDate as Date}
          endDate={endDate as Date}
          minDate={startDate as Date}
          placeholderText="End Date"
        />
      </div>

      {/* Interview Title */}
      <div className="items-center space-x-2 mb-5">
        <label className="font-medium">Interview Title:</label>
        <select
          value={interviewTitle}
          onChange={handleTemplateChange}
          className="border rounded p-2  dark:bg-gray-600"
        >
          <option value="">Select Title</option>
          {/* Add options here */}
        </select>
      </div>

      <div className=" items-center space-x-2 mb-5">
        {/* Search Bar */}
        <InterviewSearchBar
          searchQuery={filters.searchQuery}
          onSearch={(query) => onFilterChange({ searchQuery: query })}
        />
      </div>
    </div>
  );
};
