import { z } from 'zod';

export const EvaluationScoreSchema = z.object({
  id: z.string(),
  name: z.string(),
  score: z.number().min(1).max(10),
  feedback: z.string(),
});

export const QuestionAnswerFeedbackSchema = z.object({
  question: z.string(),
  answer: z.string(),
  mark: z.number().min(1).max(100),
  feedback: z.string(),
});

export const FeedbackDataSchema = z.object({
  overall_grade: z.number().min(1).max(100),
  evaluation_scores: z.array(EvaluationScoreSchema),
  strengths: z.string(),
  areas_for_improvement: z.string(),
  recommendations: z.string(),
  question_answer_feedback: z.array(QuestionAnswerFeedbackSchema),
});
