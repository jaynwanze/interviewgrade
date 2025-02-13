'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Interview } from '@/types';
import { InterviewHistoryItem } from './InterviewHistoryItem';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export const InterviewHistoryList = ({
  interviews,
  interviewModeToggle,
}: {
  interviews: Interview[];
  interviewModeToggle: string;
}) => {
  const interviewModeDisplayString =
    interviewModeToggle === 'Interview Mode'
      ? 'interviews'
      : 'practice sessions';

  const [currentPage, setCurrentPage] = useState(1);
  const interviewsPerPage = 5; // Number of interviews per page

  const totalPages = Math.ceil(interviews.length / interviewsPerPage);

  // Calculate indexes for pagination
  const indexOfLastInterview = currentPage * interviewsPerPage;
  const indexOfFirstInterview = indexOfLastInterview - interviewsPerPage;
  const currentInterviews = interviews.slice(indexOfFirstInterview, indexOfLastInterview);

  // Handle page navigation
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [interviews]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {interviews.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4">
            {currentInterviews.map((interview) => (
              <InterviewHistoryItem key={interview.id} interview={interview} />
            ))}
          </div>

          {/* Shadcn Pagination */}
          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => goToPage(currentPage - 1)}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>

              {[...Array(totalPages)].map((_, index) => (
                <PaginationItem key={index}>
                  <PaginationLink
                    onClick={() => goToPage(index + 1)}
                    isActive={index + 1 === currentPage}
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {totalPages > 5 && <PaginationEllipsis />}

              <PaginationItem>
                <PaginationNext
                  onClick={() => goToPage(currentPage + 1)}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </>
      ) : (
        <Card className="p-6 w-full max-w-2xl mx-auto shadow-md hover:shadow-lg transition duration-200">
          <h3 className="text-xl font-semibold">
            No {interviewModeDisplayString} found
          </h3>
          <p className="text-gray-500">
            No {interviewModeDisplayString} found for this filter.
            <br />
            Please check back later.
          </p>
        </Card>
      )}
    </div>
  );
};
