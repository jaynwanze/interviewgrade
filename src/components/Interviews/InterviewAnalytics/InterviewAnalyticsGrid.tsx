'use client';
import { InterviewAnalytics } from '@/types';
import { InterviewCurrentAverageCard } from './InterviewCurrentAverageCard';

export const InterviewAnalyticsGrid = ({
    analyticsData,
}: {
    analyticsData: InterviewAnalytics;
}) => {
    if (!analyticsData) {
        return (
            <p className="text-center">
                No interview current averages and summaries data available at this
                current time.
            </p>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
            <InterviewCurrentAverageCard
                data={analyticsData}
            />
        </div>
    );
};
