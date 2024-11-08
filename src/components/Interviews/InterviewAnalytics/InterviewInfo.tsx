'use client';

import React from 'react';

interface InterviewInfoProps {
    title: string | null;
    description: string | null;
    periodStart: string;
    periodEnd: string;
}

export const InterviewInfo: React.FC<InterviewInfoProps> = ({
    title,
    description,
    periodStart,
    periodEnd,
}) => {
    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                {title || 'Deleted Template'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
                {description || 'No description available.'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Period: {new Date(periodStart).toLocaleDateString()} -{' '}
                {new Date(periodEnd).toLocaleDateString()}
            </p>
            <a href="#" className="text-blue-500 dark:text-blue-400 hover:underline">
                View interview history
            </a>
        </div>
    );
};
