'use client';
import { useEffect, useState } from 'react';

const getRandomItem = (arr: string[]): string => {
  if (arr.length === 0) return 'No data available.';
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
};

export const HighlightedItem = ({
  items,
  label,
}: {
  items: string[];
  label: string;
}) => {
  const [randomItem, setRandomItem] = useState<string>(getRandomItem(items));

  useEffect(() => {
    const interval = setInterval(() => {
      setRandomItem(getRandomItem(items));
    }, 5000); // 5000 milliseconds = 5 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [items]);

  return (
    <div className="text-center">
      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300">
        {label}
      </h4>
      <span className="text-xl font-medium me-2 px-2.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
        {randomItem}
      </span>
    </div>
  );
};
