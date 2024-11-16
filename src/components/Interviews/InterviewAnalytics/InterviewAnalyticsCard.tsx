'use client';

import { Card } from '@/components/ui/card';
import { InterviewAnalytics } from '@/types';
import { InterviewInfo } from './InterviewInfo';
import { InterviewKeyMetrics } from './InterviewKeyMetrics';
import { InterviewSummaries } from './InterviewSummaries';

export const InterviewAnalyticsCard = ({
    data,
}: {
    data: InterviewAnalytics;
}) => {
    return (
        <Card className="shadow rounded-lg p-6 flex flex-col space-y-4 transition-colors duration-300">
            <div className="text-center">
                <InterviewInfo
                    title={
                        data.interview_title
                            ? data.interview_title
                            : 'Deleted interview template'
                    }
                    description={
                        data.template_id
                            ? data.interview_description
                            : 'No description available.'
                    }
                    periodStart={data.period_start}
                    periodEnd={data.period_end}
                />
            </div>
            <InterviewKeyMetrics
                totalInterviews={data.total_interviews}
                avgOverallScore={data.avg_overall_score}
                avgEvaluationCriteria={data.avg_evaluation_criteria_scores}
            />
            <InterviewSummaries
                strengths={data.strengths_summary}
                areasForImprovement={data.areas_for_improvement_summary}
                recommendations={data.recommendations_summary}
            />
        </Card>
    );
};