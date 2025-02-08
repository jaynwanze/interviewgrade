'use client';

import { Interview } from "@/types";
import { InterviewHistoryItem } from "./InterviewHistoryItem";
import { Card } from "@/components/ui/card";

export const InterviewHistoryList = ({
  interviews,
  interviewModeToggle,
}: {
  interviews: Interview[];
  interviewModeToggle: string;
}) => {
  const interviewModeDisplayString =
    interviewModeToggle === "Interview Mode"
      ? "interviews"
      : "practice sessions";

  return (
    <div className="w-full max-w-4xl mx-auto">
      {interviews.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {interviews.map((interview) => (
            <InterviewHistoryItem key={interview.id} interview={interview} />
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center shadow-md">
          <h3 className="text-xl font-semibold">No {interviewModeDisplayString} found</h3>
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
