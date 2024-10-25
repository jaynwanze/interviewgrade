'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InterviewEvaulation } from '@/types';

export const InterviewFeedback: React.FC<{
  interviewTitle: string;
  feedback: InterviewEvaulation;
}> = ({ interviewTitle, feedback }) => {
  return (
    <>
      {feedback ? (
        <div className="text-center">
          <Card>
            <CardHeader>
              <CardTitle>Interview Feedback : {interviewTitle} </CardTitle>
            </CardHeader>
            <CardContent>
              <h2>Overall Score: {feedback.overall_score}</h2>
              <h3>Strengths</h3>
              <p>{feedback.strengths}</p>
              <h3>Areas for Improvement</h3>
              <p>{feedback.areas_for_improvement}</p>
              <h3>Recommendations</h3>
              <p>{feedback.recommendations}</p>
              <h3>Evaluation Scores</h3>
              <ul>
                {Object.entries(feedback.evaluation_scores).map(
                  ([criterionName, data]) => (
                    <li key={criterionName}>
                      <strong>{criterionName}</strong>: Score {data.score}
                      <br />
                      Feedback: {data.feedback}
                    </li>
                  ),
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div>Feedback not available</div>
      )}
    </>
  );
};
