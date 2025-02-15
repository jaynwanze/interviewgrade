'use client';

import React from 'react';

export const SummaryList = ({ items }: { items: string[] }) => {
  return (
    <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-200 mb-2">
      {items.length > 0 ? (
        items.map((item, index) => <li key={index}>{item}</li>)
      ) : (
        <li>No entries available.</li>
      )}
    </ul>
  );
};
