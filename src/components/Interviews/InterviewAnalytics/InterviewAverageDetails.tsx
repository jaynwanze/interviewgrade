import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InterviewAnalytics } from '@/types';
import { InterviewCurrentAverageKeyMetrics } from './InterviewCurrentAverageKeyMetrics';
import { InterviewInfo } from './InterviewInfo';

export const InterviewAverageDetails = ({
    analyticsData,
}: {
    analyticsData: InterviewAnalytics;
}) => {
    return (
        <>
            <Card className="shadow rounded-lg p-6 flex flex-col space-y-4 mb-5 text-center">
                <InterviewInfo
                    title={
                        analyticsData.interview_title
                            ? analyticsData.interview_title
                            : 'Deleted interview template'
                    }
                    description={
                        analyticsData.interview_description
                            ? analyticsData.interview_description
                            : 'No description available.'
                    }
                />
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-5">
                <Card className="shadow rounded-lg">
                    <CardHeader>
                        <CardTitle>Current Average Overall Grade</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold text-center mb-2">
                            {analyticsData.avg_overall_grade.toFixed(1)}%
                        </p>
                        <p>Current grade averaged over all sessions.</p>
                    </CardContent>
                </Card>
                <Card className="shadow rounded-lg">
                    <CardHeader>
                        <CardTitle>Average Mark Per Question</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold text-center mb-2">
                            {(
                                analyticsData.avg_overall_grade / analyticsData.question_count
                            ).toFixed(2)}
                            /{Math.floor(100 / analyticsData.question_count)}
                        </p>
                        <p>Current average marks you are scoring per question</p>
                    </CardContent>
                </Card>
                <Card className="shadow rounded-lg">
                    <CardHeader>
                        <CardTitle>Total Sessions Count</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold text-center mb-2">
                            {analyticsData?.total_interviews || 0}
                        </p>
                        <p>
                            Total completed {analyticsData.interview_title.toLowerCase()}{' '}
                            sessions. .
                        </p>
                    </CardContent>
                </Card>
            </div>
            <InterviewCurrentAverageKeyMetrics
                totalInterviews={analyticsData.total_interviews}
                avgOverallScore={analyticsData.avg_overall_grade}
                avgEvaluationCriteria={analyticsData.avg_evaluation_criteria_scores}
            />
        </>
    );
};
