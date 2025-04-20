'use client';

import { InterviewModeCard } from '@/components/Interviews/InterviewLibrary/InterviewModeCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
import { getRecentInterviews } from '@/data/user/interviews';
import { Interview } from '@/types';
import { INTERVIEW_MODES } from '@/utils/constants';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function InterviewMode() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  useEffect(() => {
    fetchInterviews();
  }, []);

  const handleClick = (status: string, interviewId: string) => {
    const url =
      status === 'completed'
        ? `/candidate/interview-history/${interviewId}`
        : `/candidate/interviews/session/${interviewId}`;

    router.push(url);
  };

  const fetchInterviews = async () => {
    try {
      // Fetch interviews
      const interviews = await getRecentInterviews();
      setInterviews(interviews);
    } catch (err) {
      console.error('Error fetching interviews:', err);
      setError('Failed to load recent interviews');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="mx-auto max-w-4xl">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-1"> Select Interview Mode</h1>
        <p className="text-gray-500">
          Choose the best mode for your mock interview experience.
        </p>
      </div>
      <Separator className="my-4" />
      <div className="grid xs:grid-cols-1 sm:grid-cols-2 mt-6 justify-items-center">
        {INTERVIEW_MODES.map((mode) => (
          <InterviewModeCard key={mode} name={mode} />
        ))}
      </div>
      <Separator className="my-4" />
      {/* Error message */}
      {error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : (
        <>
          {loading ? (
            <div className="text-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="mt-6">
              {/* Interview List */}
              {interviews.length === 0 && !loading && (
                <div className="text-center text-gray-500">
                  You have no recent interviews yet.
                </div>
              )}
              <CardTitle className=" text-gray-400 mb-2">
                Recent Interviews
              </CardTitle>
              <Table>
                <TableCaption>List of your recent interviews.</TableCaption>

                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Interview</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Appointment</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {interviews.map((interview) => (
                    <TableRow key={interview.id}>
                      <TableCell className="font-medium">
                        {interview.title}
                      </TableCell>
                      <TableCell>
                        {interview.status === 'completed'
                          ? 'Completed'
                          : 'Pending'}
                      </TableCell>
                      <TableCell>
                        {new Date(interview.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleClick(interview.status, interview.id)
                          }
                        >
                          {interview.status === 'completed'
                            ? 'Read Report'
                            : 'Resume '}
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
                        Page 1 / 1 | Total {interviews.length}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
