'use client';
import { InterviewAnalytics } from '@/types';
import { InterviewAnalyticsCard } from './InterviewAnalyticsCard';

export const InterviewAnalyticsGrid = ({
    analyticsData,
}: {
    analyticsData: InterviewAnalytics[];
}) => {
    if (analyticsData.length === 0) {
        return (
            <p className="text-center">
                No analytics data available for the selected filters.
            </p>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6 mb-6" >
            {analyticsData.map((data) => (
                <InterviewAnalyticsCard key={data.id} data={data} />
            ))}
        </div>
    );
};
