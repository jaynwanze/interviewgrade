'use client';

import { InterviewModeCard } from '@/components/Interviews/InterviewLibrary/InterviewModeCard';
import { Button } from '@/components/ui/button';
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
import { INTERVIEW_MODES } from '@/utils/constants';

// Example data. Replace with real interviews fetched from your DB or an API.
const interviews = [
  {
    id: '1',
    title: 'Software Engineer',
    status: 'Completed',
    appointment: 'N/A',
  },
  {
    id: '2',
    title: 'Product Manager',
    status: 'Upcoming',
    appointment: 'March 28, 2024 10:00 AM',
  },
];

export function InterviewMode() {
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
      <div className="grid grid-cols-2 md:grid-cols-2 gap-6 mt-6">
        {INTERVIEW_MODES.map((mode) => (
          <InterviewModeCard key={mode} name={mode} />
        ))}
      </div>
      //show limit of up to 5 recent interviews
      <div className="flex justify-center mt-6">
        <Table>
          {/* Adjust caption or remove if not needed */}
          <TableCaption>
            Below is a list of your recent interviews.
          </TableCaption>

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
                <TableCell className="font-medium">{interview.title}</TableCell>
                <TableCell>
                  {/* You could style status with a badge, e.g. "Completed", "In Progress" */}
                  {interview.status}
                </TableCell>
                <TableCell>{interview.appointment}</TableCell>
                <TableCell className="text-right">
                  {/* Example button. Replace with your actual action (e.g. "Read Report" link) */}
                  <Button variant="outline" size="sm">
                    Read Report
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

          {/* Optional footer row */}
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4}>
                {/* If you have pagination or summary, you can place it here */}
                <span className="text-sm text-muted-foreground">
                  Page 1 / 1 | Total {interviews.length}
                </span>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
