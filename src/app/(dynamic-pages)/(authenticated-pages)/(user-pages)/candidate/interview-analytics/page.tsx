'use client';

import { Suspense } from 'react';
import InterviewGraphs from './_graphs/InterviewGraphs';

export default function InterviewAnaltyicsPage() {
    return (
        <div>
            <Suspense>
                <InterviewGraphs />
            </Suspense>
        </div>
    );
}
