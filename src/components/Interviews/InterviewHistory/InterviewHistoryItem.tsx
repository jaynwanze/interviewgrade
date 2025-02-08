'use client';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { Interview } from '@/types';

export const InterviewHistoryItem = ({ interview }: { interview: Interview }) => {
  const router = useRouter();

  const handleViewDetailsClick = () => {
    router.push(`/candidate/interview-history/${interview.id}`);
  };

  const handleFinishSessionClick = () => {
    router.push(`/candidate/interviews/session/${interview.id}`);
  };

  const displayStatus = interview.status === 'completed'
    ? 'Completed'
    : interview.status === 'in_progress'
      ? 'In Progress'
      : interview.status === 'not_started'
        ? 'Not Started'
        : 'Unknown';

  const statusColor =
    interview.status === 'completed' ? 'bg-green-500' :
    interview.status === 'in_progress' ? 'bg-yellow-500' :
    interview.status === 'not_started' ? 'bg-gray-500' :
    'bg-red-500';

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-md hover:shadow-lg transition duration-200">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">{interview.title}</CardTitle>
          <Badge className={`${statusColor} text-white px-3 py-1 rounded-md text-sm`}>
            {displayStatus}
          </Badge>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="mt-2 space-y-1">
        <p className="text-gray-600">
          <strong>Started At:</strong> {interview.start_time ? new Date(interview.start_time).toLocaleString() : 'N/A'}
        </p>
        <p className="text-gray-600">
          <strong>Completed At:</strong> {interview.end_time ? new Date(interview.end_time).toLocaleString() : 'N/A'}
        </p>
      </CardContent>

      <CardFooter className="flex justify-end space-x-2">
        {interview.status === 'completed' ? (
          <Button onClick={handleViewDetailsClick} variant="outline">
            View Details
          </Button>
        ) : (
          <Button onClick={handleFinishSessionClick}>Resume Interview</Button>
        )}
      </CardFooter>
    </Card>
  );
};
