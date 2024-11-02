'use client';
import { InterviewHistoryDetails } from '@/components/Interviews/InterviewHistory/InterviewHistoryDetails';
import { useRouter } from 'next/router';
import React from 'react';

export const InterviewHistoryDetailssPage: React.FC = () => {
    const router = useRouter();
    const { historyId } = router.query;

    if (!historyId || typeof historyId !== 'string') {
        return <div className="text-center p-4">Invalid interview ID.</div>;
    }

    return <InterviewHistoryDetails interviewId={historyId} />;
};
