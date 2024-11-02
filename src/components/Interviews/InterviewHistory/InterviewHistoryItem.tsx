'use client';

import { Interview } from '@/types';
import Link from 'next/link';

export const InterviewHistoryItem = ({
    interview,
}: {
    interview: Interview;
}) => {
    return (
        <div className="border rounded-lg p-4 hover:bg-gray-100 transition duration-200">
      <h3 className="text-xl font-semibold">{interview.title}</h3>
      <p className="text-gray-600">Status: {interview.status}</p>
      <p className="text-gray-600">
        Started At: {interview.start_time ? new Date(interview.start_time).toLocaleString() : 'N/A'}
      </p>
      <p className="text-gray-600">
        Completed At: {interview.end_time ? new Date(interview.end_time).toLocaleString() : 'N/A'}
      </p>
      <Link href={`/interview-history/${interview.id}`}>
        <a className="text-blue-500 underline mt-2 inline-block">View Details</a>
      </Link>
    </div>
    );
};
