// utils/openai/getQuestionFeedback.ts

'use server';

import { InterviewQuestion, specificFeedbackType } from '@/types';
import OpenAI from 'openai';
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
Provide your evaluation in the following JSON format without any additional text.

\`\`\`json
{
  "mark": number,",
  "summary": string,
  "advice_for_next_question": string"
}
\`\`\`

**Note:**
- Ensure the JSON is properly formatted for parsing.
- If there is no next question, set "advice_for_next_question" to "N/A".
- Provide actionable and constructive advice to help the candidate improve.
`;
};

/**
 * Calls the OpenAI API with retry logic
 */
const callOpenAIWithRetries = async (
  prompt: string,
  retries = 3,
  delay = 1000,
): Promise<string> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        // model: 'deepseek-chat',
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.2,
      });

      const aiMessage = completion.choices?.[0]?.message?.content;
      if (!aiMessage) {
        throw new Error('No content returned from OpenAI.');
      }
      console.log('OpenAI Response:', aiMessage);
      return aiMessage;
    } catch (error) {
      if (attempt === retries) {
        console.error(
          `OpenAI API call failed after ${retries} attempts:`,
          error.message || error,
        );
        throw error;
      }
      console.warn(
        `OpenAI API call failed on attempt ${attempt}. Retrying in ${delay}ms...`,
        error.message || error,
      );
      await new Promise((res) => setTimeout(res, delay));
      delay *= 2;
    }
  }
  throw new Error('Failed to call OpenAI API after multiple attempts.');
};

/**
 * Calls the OpenAI API with the constructed prompt
 */
const callOpenAI = async (prompt: string): Promise<string> => {
  try {
    const aiMessage = await callOpenAIWithRetries(prompt);
    return aiMessage;
  } catch (error) {
    // Enhanced error handling
    if (error.response) {
      console.error(
        'OpenAI API Error:',
        error.response.status,
        error.response.data,
      );
      return 'error';
    } else if (error.request) {
      console.error('OpenAI API No Response:', error.request);
      return 'error';
    } else {
      console.error('OpenAI API Error:', error.message);
      return 'error';
    }
  }
};

/**
 * Parses the AI's JSON response safely
 */
const parseAIResponse = (aiResponse: string): specificFeedbackType => {
  try {
    let jsonString = '';

    // Attempt to extract JSON from code blocks first
    const jsonRegex = /```json([\s\S]*?)```/i;
    const match = aiResponse.match(jsonRegex);
    if (match && match[1]) {
      jsonString = match[1].trim();
    } else {
      // If no code block is found, attempt to extract JSON from the entire response
      const firstBraceIndex = aiResponse.indexOf('{');
      const lastBraceIndex = aiResponse.lastIndexOf('}');
      if (firstBraceIndex !== -1 && lastBraceIndex !== -1) {
        jsonString = aiResponse
          .substring(firstBraceIndex, lastBraceIndex + 1)
          .trim();
      } else {
        throw new Error('No JSON object found in the AI response.');
      }
    }

    // Parse the JSON string
    const parsedData = JSON.parse(jsonString);

    const feedback = specificFeedback.parse(parsedData);
    return feedback;
  } catch (error) {
    console.error('Error parsing AI response:', error.message);
    console.error('Raw AI Response:', aiResponse);
    throw new Error('Failed to parse AI response into JSON.');
  }
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
): Promise<specificFeedbackType | null> => {
  // Input Validation
  if (!currentQuestion.text.trim()) {
    throw new Error('Current question text cannot be empty.');
  }

  if (!currentAnswer.trim()) {
    throw new Error('Current answer cannot be empty.');
  }

  // Construct the prompt
  const prompt = constructQuestionFeedbackPrompt(
    skill,
    currentQuestion,
    currentAnswer,
    nextQuestion,
    interview_question_count,
  );

  // Call OpenAI API
  const aiResponse = await callOpenAI(prompt);
  if (aiResponse === 'error') {
    return null;
  }

  // Parse AI response
  const feedback = parseAIResponse(aiResponse);
  return feedback;
};
