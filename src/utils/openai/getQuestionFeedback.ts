// utils/openai/getQuestionFeedback.ts

'use server';

import { InterviewQuestion } from '@/types';
import OpenAI from 'openai';
import { Readable } from 'stream';
import { z } from 'zod';

const specificFeedback = z.object({
  mark: z.number(),
  summary: z.string(),
  advice_for_next_question: z.string(),
});

// Initialize OpenAI Client
const openAiKey = process.env.OPENAI_SECRET_KEY;

if (!openAiKey) {
  throw new Error(
    'OpenAI API key is missing. Please set OPENAI_SECRET_KEY in your environment variables.',
  );
}

const openai = new OpenAI({
  apiKey: openAiKey,
});

// // deepSeekKey OpenAI Client
// const deepSeekKey = process.env.DEEPSEEK_API_KEY;

// if (!deepSeekKey) {
//   throw new Error(
//     'OpenAI API key is missing. Please set OPENAI_SECRET_KEY in your environment variables.',
//   );
// }

// const openai = new OpenAI({
//   baseURL: 'https://api.deepseek.com',
//   apiKey: deepSeekKey,
// });


/**
 * Constructs the prompt for OpenAI based on the current question and answer
 */
const constructQuestionFeedbackPrompt = (
  skill: string,
  currentQuestion: InterviewQuestion,
  currentAnswer: string,
  nextQuestion: InterviewQuestion | null,
  interview_question_count: number,
): string => {
  // Helper function to format rubrics
  const formatRubrics = (
    rubrics: { order: number; percentage_range: string; description: string }[],
  ) =>
    rubrics
      .sort((a, b) => a.order - b.order)
      .map((rubric) => `| ${rubric.percentage_range} | ${rubric.description} |`)
      .join('\n');

  // Format the evaluation criteria
  const formattedCriteria = `**${currentQuestion.evaluation_criteria.name}**: ${currentQuestion.evaluation_criteria.description}\n   
| Percentage Range | Description |
|------------------|-------------|
${formatRubrics(currentQuestion.evaluation_criteria.rubrics)}`;

  const numberOfQuestions = interview_question_count || 1;
  const maxTotalScore = 100;
  // round to two decimal places
  const maxScorePerQuestion = Math.floor(maxTotalScore / numberOfQuestions);

  return `### Interview Practice Feedback

As an interviewer for an innovative online interview platform, your task is to evaluate candidates based on their responses practicing **${skill}** questions.

### Evaluation Criteria
Evaluate the candidate based on the following criteria, using the rubric provided:

${formattedCriteria}

### Current Question
**Question**: ${currentQuestion.text}

**Answer**: "${currentAnswer}"

### Next Question
${nextQuestion ? `**Question**: ${nextQuestion.text}` : '**Question**: N/A'}

### Instructions
Your evaluation should include:
- **Mark**: Assign a numerical score out of ${maxScorePerQuestion} based on the candidate's performance relative to the rubric. Ensure that the mark reflects the degree to which the candidate meets the criteria outlined in the rubric.
- **Summary**: Short/Concise evalaution of the candidate's answer to the current question and based off the evalution criteria.
- **Advice for Next Question**: Offer advice for how to answer the next question effectively.

### Output Format
Provide your evaluation in the following JSON format only, without any additional text, explanations, Markdown formatting, or code blocks. Ensure that all sentences have proper spacing between words.

{
  "mark": number,
  "summary": string,
  "advice_for_next_question": string
}

**Note:**
- Ensure the JSON is properly formatted for parsing.
- If there is no next question, set "advice_for_next_question" to "N/A".
- Provide actionable and constructive advice to help the candidate improve.
`;
};
/**
 * Calls the OpenAI API with streaming and returns an async iterable
 */
const callOpenAIStream = async (
  prompt: string,
): Promise<AsyncIterable<OpenAI.Chat.ChatCompletionChunk>> => {
  const response = openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 500,
    temperature: 0.2,
    store: true,
    stream: true,
  });

  return response as unknown as AsyncIterable<OpenAI.Chat.ChatCompletionChunk>;
};

/**
 * Main function to get question-specific feedback from OpenAI
 */
export const getQuestionFeedback = async (
  skill: string,
  currentQuestion: InterviewQuestion,
  currentAnswer: string,
  nextQuestion: InterviewQuestion | null,
  interview_question_count: number,
): Promise<AsyncIterable<OpenAI.Chat.ChatCompletionChunk>> => {

  // Construct the prompt
  const prompt = constructQuestionFeedbackPrompt(
    skill,
    currentQuestion,
    currentAnswer,
    nextQuestion,
    interview_question_count,
  );

  // Call OpenAI API with streaming
  const stream = await callOpenAIStream(prompt);
  return stream;
};