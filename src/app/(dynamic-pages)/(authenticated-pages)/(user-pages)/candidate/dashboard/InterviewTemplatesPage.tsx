'use client';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useWalkthrough } from '@/contexts/WalkthroughContext';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { Interview, InterviewAnalytics } from '@/types';
import {
    INTERVIEW_INTERVIEW_MODE,
    INTERVIEW_PRACTICE_MODE,
} from '@/utils/constants';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import 'shepherd.js/dist/css/shepherd.css';

export default function InterviewAnalyticsPage() {
    const {
        loadingOverview,
        loadingDetailed,
        error,
        overview,
        fetchDetailedData,
        currentSentimentDetailed,
    } = useAnalyticsData();

    const searchParams = useSearchParams();
    const { startTour } = useWalkthrough();
    const isTutorialMode = searchParams.get('1') === 'true';
    const [tourStarted, setTourStarted] = useState(false);

    const [detailed, setDetailed] = useState<InterviewAnalytics | null>(null);
    const [activeSwitch, setActiveSwitch] = useState<'Practice Mode' | 'Interview Mode'>(
        'Practice Mode',
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
    const [filteredCompletedInterviews, setFilteredCompletedInterviews] = useState<Interview[]>([]);
    const router = useRouter();

    // Debounce the search query
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Tour steps
    const analyticsTourSteps = [
        {
            id: 'dashboard-overview',
            title: 'Welcome to Your Analytics Dashboard',
            text: 'Track your progress and improve your performance here.',
            attachTo: { element: '.dashboard-overview', on: 'bottom' as const },
            buttons: [{ text: 'Next', action: () => this.next() }],
        },
        {
            id: 'latest-interview',
            title: 'Latest Interview Summary',
            text: 'View a quick snapshot of your most recent interview.',
            attachTo: { element: '.latest-interview-card', on: 'top' as const },
            buttons: [
                { text: 'Back', action: () => this.back() },
                { text: 'Next', action: () => this.next() },
            ],
        },
    ];

    // Switch handling
    const handleSwitchChange = useCallback(
        (switchMode: 'Practice Mode' | 'Interview Mode') => {
            setActiveSwitch(switchMode);
            if (overview?.completedInterviews?.length) {
                let filtered = [...overview.completedInterviews];
                if (switchMode === 'Practice Mode') {
                    filtered = filtered.filter(interview => interview.mode === INTERVIEW_PRACTICE_MODE);
                } else {
                    filtered = filtered.filter(interview => interview.mode === INTERVIEW_INTERVIEW_MODE);
                }
                setFilteredCompletedInterviews(filtered);
            }
        },
        [overview],
    );

    useEffect(() => {
        handleSwitchChange(activeSwitch);
    }, [handleSwitchChange, activeSwitch]);

    // Start tour if in tutorial mode
    useEffect(() => {
        if (isTutorialMode && !tourStarted) {
            startTour(analyticsTourSteps);
            setTourStarted(true);
        }
    }, [isTutorialMode, tourStarted, startTour]);

    // Filter results by debounced query
    const uniqueFilteredTemplateInterviews = useMemo(() => {
        if (!filteredCompletedInterviews) return [];
        const uniqueTitles = new Set<string>();
        const templates: Interview[] = [];
        const searchLower = debouncedQuery.toLowerCase();
        filteredCompletedInterviews.forEach(interview => {
            const titleLower = interview.title.toLowerCase();
            if (titleLower.includes(searchLower) && !uniqueTitles.has(titleLower)) {
                uniqueTitles.add(titleLower);
                templates.push(interview);
            }
        });
        return templates;
    }, [debouncedQuery, filteredCompletedInterviews]);

    // Navigate to template details
    const handleTemplateClick = (templateId: string) => {
        router.push(`/candidate/dashboard/${templateId}`);
    };

    // Renders the main content
    const renderContent = () => {
        // Global error
        if (error) {
            return (
                <div className="text-center text-red-600 mb-4">
                    <p>Failed to load data. Please try again later.</p>
                </div>
            );
        }

        // Loading states
        if (loadingOverview || loadingDetailed) {
            return (
                <div className="flex flex-col items-center py-4">
                    <LoadingSpinner />
                    <p className="mt-2 text-gray-500">Loading your dashboard...</p>
                </div>
            );
        }

        // No data
        if (!overview?.completedInterviews?.length) {
            return (
                <div className="text-center text-gray-600 my-4">
                    <p>No interviews found. Start one to see analytics here.</p>
                </div>
            );
        }


        return (
            <div className="container mx-auto py-6 px-4 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">

                {/* Switch */}
                <div className="flex justify-center">
                    <div >
                        <h1 className="text-2xl font-bold text-center mb-1">Candidate Dashboard</h1>
                        <p className="text-center text-gray-500">View your interview performance and analytics.</p>
                        <Separator className="my-4" />
                        {/* Goal Completion Card */}
                        <Card className="mb-6 bg-blue-50 border-blue-200 text-center" >
                            <CardHeader>
                                <CardTitle>Overall Goal Completion</CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center justify-between">

                            </CardContent>
                        </Card>
                        <Card className="mb-4 p-4">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                                <Input
                                    placeholder="Search sessions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="analytics-history-mode"
                                        checked={activeSwitch === 'Interview Mode'}
                                        onCheckedChange={() =>
                                            handleSwitchChange(
                                                activeSwitch === 'Practice Mode' ? 'Interview Mode' : 'Practice Mode'
                                            )
                                        }
                                    />
                                    <Label htmlFor="analytics-history-mode">
                                        {activeSwitch}
                                    </Label>
                                </div>
                            </div>
                        </Card>
                        {/* Templates */}
                        <Card>
                            {uniqueFilteredTemplateInterviews.length === 0 ? (
                                <div className="text-center text-gray-500 p-4">
                                    No completed sessions found.
                                </div>
                            )
                                : (
                                    <>
                                        <CardHeader>
                                            <CardTitle>Interview Templates</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <Table>
                                                <TableCaption>
                                                    List of your current perfomance metrics for each template.
                                                </TableCaption>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[200px]">Title</TableHead>
                                                        <TableHead>Grade</TableHead>
                                                        <TableHead className="text-right">Action</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {uniqueFilteredTemplateInterviews.map((template) => (
                                                        <TableRow key={template.id}>
                                                            <TableCell className="font-medium">
                                                                {template.title}
                                                            </TableCell>
                                                            <TableCell>
                                                                {/* {template.score ?? '—'}% */}
                                                                %
                                                            </TableCell>

                                                            <TableCell className="text-right">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleTemplateClick(template.id)
                                                                    }>
                                                                    View Template
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                                {/* Optional footer row */}
                                                <TableFooter>
                                                    <TableRow>
                                                        <TableCell colSpan={4}>
                                                            <span className="text-sm text-muted-foreground">
                                                                Page 1 / 1 | Total {uniqueFilteredTemplateInterviews.length}
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                </TableFooter>
                                            </Table>
                                        </CardContent>
                                    </>
                                )}
                        </Card>

                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-4">
                    {/* Profile Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <div className="rounded-full h-20 w-20 bg-gray-300 mx-auto mb-2" />
                            <p className="font-semibold">You</p>
                            <p className="text-sm text-gray-500">Aspiring Professional</p>
                        </CardContent>
                    </Card>

                    {/* Mini Chart Placeholder */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600">Coming soon: Skill radar & weekly goal graph.</p>
                            {/* You can insert <RadarChart /> or <LineChart /> here */}
                        </CardContent>
                    </Card>

                    {/* Tips / AI Suggestions */}
                    <Card className="bg-blue-100 border-blue-300">
                        <CardContent className="py-4">
                            <p className="text-sm font-medium">💡 Keep it up!</p>
                            <p className="text-xs text-gray-700 mt-1">
                                You’ve improved your Communication score by 12% over your last 3 interviews.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div >
        );
    };

    return (
        <div className="dashboard-overview container mx-auto p-4 w-3/4">

            {renderContent()}
        </div>
    );
}