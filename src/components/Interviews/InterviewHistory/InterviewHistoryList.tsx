'use client';

import { Interview } from '@/types';
import { InterviewHistoryItem } from './InterviewHistoryItem';

export const InterviewHistoryList = ({
    interviews,
}: {
    interviews: Interview[];
}) => {
    if (interviews.length === 0) {
        return <div>No interviews found in this category.</div>;
    }

    return (
        <div className="space-y-4">
            {interviews.map((interview) => (
                <InterviewHistoryItem key={interview.id} interview={interview} />
            ))}
        </div>
    );
};
