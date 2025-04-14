// utils/openai/getQuestionFeedback.ts

'use server';

import {
  EvaluationCriteriaType,
  InterviewQuestion,
  specificFeedbackType,
} from '@/types';
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

// Build a short system message with your rubric & instructions
function buildSystemMessage(evaluationCriterias: EvaluationCriteriaType[]) {
  const maxScorePerQuestion = 100;

  const formatRubrics = (
    rubrics: { order: number; percentage_range: string; description: string }[],
  ) =>
    rubrics
      .sort((a, b) => a.order - b.order)
      .map((rubric) => `| ${rubric.percentage_range} | ${rubric.description} |`)
      .join('\n');

  // Format the evaluation criteria
  const formattedCriteria = evaluationCriterias
    .map(
      (criterion, index) =>
        `${index + 1}. **${criterion.name}**: ${criterion.description}\n   
| Percentage Range | Description |
|------------------|-------------|
${formatRubrics(criterion.rubrics)}`,
    )
    .join('\n\n');
  return {
    role: 'system' as const,
    content: `
You are an AI interviewer providing short JSON feedback. 
Rubric (score out of 100):
${formattedCriteria}

### Instructions
Your evaluation should include:
- **Mark**: Assign a numerical score out of ${maxScorePerQuestion} based on the candidate's performance relative to the rubric. Ensure that the mark reflects the degree to which the candidate meets the criteria outlined in the rubric.
- **Summary**: Short/Concise evalaution of the candidate's answer to the current question and based off the evalution criteria.
- **Advice for Next Question**: Offer advice for how to answer the next question effectively.

### Output Format
Provide your evaluation in the following JSON format without any additional text.

Output JSON only:
{
  "mark": number,
  "summary": string,
  "advice_for_next_question": string
}

**Note:**
- Ensure the JSON is properly formatted for parsing.
- If there is no next question, set "advice_for_next_question" to "N/A".
- Provide actionable and constructive advice to help the candidate improve.
-If the candidate's response is not provided, assume a score of 0 for that question.
-If the candidate's response is not relevant to the evaluation criteria, provide feedback accordingly.
-If the candidate's response is lacking or terrible, score it really low or zero marks if necessary and provide constructive feedback.
-If the candidate's response is partially relevant, provide partial credit based on the relevance.
-If the candidate's response is exemplary, provide full credit, fulls marks where due and highlight the strengths.
`,
  };
}

/**
 * Constructs the prompt for OpenAI based on the current question and answer
 */
function constructQuestionFeedbackPrompt(
  skill: string,
  currentQuestion: InterviewQuestion,
  currentAnswer: string,
  nextQuestion: InterviewQuestion | null,
  interview_question_count: number,
  intervieEvaluationsCriterias: EvaluationCriteriaType[],
) {
  return {
    role: 'system' as const,
    content: `
### Current Question
**Linked Evaluation Criteria**: ${currentQuestion.evaluation_criteria.name}

**Question**: ${currentQuestion.text}

**Answer**: "${currentAnswer}"

### Next Question
${nextQuestion ? `**Question**: ${nextQuestion.text}` : '**Question**: N/A'}

### Output Format
**Note**: Provide your evaluation in the following JSON format without any additional text.

\`\`\`json
{
  "mark": number,
  "summary": string,
  "advice_for_next_question": string
}
\`\`\`
`,
  };
}

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
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150, // or 50, or 100
        temperature: 0.2,
      });

      const aiMessage = completion.choices?.[0]?.message?.content;
      console.log('AI Response - Practice Feedback:', aiMessage); // Log the AI response for debugging
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
    console.log('Question Feedback Prompt: ', prompt);
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
  intervieEvaluationsCriterias: EvaluationCriteriaType[],
): Promise<specificFeedbackType | null> => {
  // Input Validation
  if (!currentQuestion.text.trim()) {
    throw new Error('Current question text cannot be empty.');
  }

  if (!currentAnswer.trim()) {
    throw new Error('Current answer cannot be empty.');
  }
  try {
    // Construct the prompt
    const systemMsg = buildSystemMessage(intervieEvaluationsCriterias);
    const userMsg = constructQuestionFeedbackPrompt(
      skill,
      currentQuestion,
      currentAnswer,
      nextQuestion,
      interview_question_count,
      intervieEvaluationsCriterias,
    );
    // // Call OpenAI API
    // const aiResponse = await callOpenAI(s);
    // if (aiResponse === 'error') {
    //   return null;
    // }

    // Call the OpenAI chat completion
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // or gpt-3.5-turbo
      messages: [systemMsg, userMsg],
      max_tokens: 150, //
      temperature: 0.2,
    });

    // Parse AI response
    const aiMessage = response.choices[0]?.message?.content;
    if (!aiMessage) {
      console.error('No content from AI');
      return null;
    }
    const feedback = parseAIResponse(aiMessage);
    return feedback;
  } catch (error) {
    console.error('Error in getQuestionFeedback:', error.message);
    return null;
  }
};
