// utils/openai/getQuestionFeedback.ts

'use server';

import { InterviewQuestion } from '@/types';
import OpenAI from 'openai';
import { z } from 'zod';

const specificFeedback = z.object({
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

/**
 * Constructs the prompt for OpenAI based on the current question and answer
 */
const constructQuestionFeedbackPrompt = (
  currentQuestion: InterviewQuestion,
  currentAnswer: string,
  nextQuestion: InterviewQuestion | null,
): string => {
  return `### Interview Practice Feedback

You are an AI assistant providing feedback for a practice interview.

### Current Question
**Question**: ${currentQuestion.text}

**Answer**: "${currentAnswer}"

### Next Question
${nextQuestion ? `**Question**: ${nextQuestion.text}` : '**Question**: N/A'}

### Instructions
Provide a concise summary of the candidate's answer to the current question and offer advice for how to answer the next question effectively.

\`\`\`json
{
  "summary": "Your summary here.",
  "advice_for_next_question": "Your advice here."
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
      const completion = await openai.beta.chat.completions.parse({
        model: 'gpt-3.5-turbo', // Use 'gpt-4' if preferred
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.5,
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
const parseAIResponse = (
  aiResponse: string,
): { summary: string; advice_for_next_question: string } => {
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

    // Validate the structure
    if (
      typeof parsedData.summary === 'string' &&
      typeof parsedData.advice_for_next_question === 'string'
    ) {
      return {
        summary: parsedData.summary,
        advice_for_next_question: parsedData.advice_for_next_question,
      };
    } else {
      throw new Error('Invalid structure of the parsed JSON.');
    }
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
  currentQuestion: InterviewQuestion,
  currentAnswer: string,
  nextQuestion: InterviewQuestion | null,
): Promise<{ summary: string; advice_for_next_question: string } | null> => {
  // Input Validation
  if (!currentQuestion.text.trim()) {
    throw new Error('Current question text cannot be empty.');
  }

  if (!currentAnswer.trim()) {
    throw new Error('Current answer cannot be empty.');
  }

  if (nextQuestion && !nextQuestion.text.trim()) {
    throw new Error('Next question text cannot be empty.');
  }

  // Construct the prompt
  const prompt = constructQuestionFeedbackPrompt(
    currentQuestion,
    currentAnswer,
    nextQuestion,
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
