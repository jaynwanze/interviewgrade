'use server';

import { insertInterviewEvaluation } from '@/data/user/interviews';
import {
  EvaluationCriteriaType,
  FeedbackData,
  Interview,
  InterviewAnswerDetail,
} from '@/types';
import OpenAI from 'openai';
import { z } from 'zod';

const feedback = z.object({
  overall_grade: z.number(),
  evaluation_scores: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      score: z.number(),
      feedback: z.string(),
    }),
  ),
  strengths: z.string(),
  areas_for_improvement: z.string(),
  recommendations: z.string(),
  question_answer_feedback: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
      mark: z.number(),
      feedback: z.string(),
    }),
  ),
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
 * Constructs the prompt for OpenAI based on the interview details
 */
const constructPrompt = (
  interviewTitle: string,
  evaluationCriteria: EvaluationCriteriaType[],
  interviewAnswersDetails: InterviewAnswerDetail[],
  interviewMode: string,
): string => {
  // Determine maximum score per question
  const numberOfQuestions = interviewAnswersDetails.length || 1;
  const maxTotalScore = 100;
  // round to two decimal places
  const maxScorePerQuestion =
    interviewMode === 'interview'
      ? Math.floor(maxTotalScore / numberOfQuestions)
      : maxTotalScore;

  // Helper function to format rubrics
  const formatRubrics = (
    rubrics: { order: number; percentage_range: string; description: string }[],
  ) =>
    rubrics
      .sort((a, b) => a.order - b.order)
      .map((rubric) => `| ${rubric.percentage_range} | ${rubric.description} |`)
      .join('\n');

  // Format the evaluation criteria
  const formattedCriteria = evaluationCriteria
    .map(
      (criterion, index) =>
        `${index + 1}. **${criterion.name}**: ${criterion.description}\n   
| Percentage Range | Description |
|------------------|-------------|
${formatRubrics(criterion.rubrics)}`,
    )
    .join('\n\n');

  // Format the candidate's responses
  const formattedResponses = interviewAnswersDetails
    .map(
      (detail) =>
        `**Question**: ${detail.question}\n**Answer**: "${detail.answer}"\n**Evaluation Criteria**: ${detail.evaluation_criteria_name}`,
    )
    .join('\n\n');

  // Construct the evaluation scores and feedback templates
  const evaluationScoresTemplate = evaluationCriteria
    .map(
      (criterion) => `{
  "id": "${criterion.id}",
  "name": "${criterion.name}",
  "score": 0,
  "feedback": ""
}`,
    )
    .join(',\n    ');

  const questionAnswerFeedbackTemplate = interviewAnswersDetails
    .map(
      (detail) => `{
  "question": "${detail.question}",
  "answer": "${detail.answer}",
  "mark":"${interviewMode === 'interview' ? detail.mark : detail.mark / numberOfQuestions}",
  "feedback": "${detail.feedback}"	
}`,
    )
    .join(',\n    ');
  // Construct the prompt
  return `### Interview Context
As an interviewer for an innovative online interview platform, your task is to evaluate candidates based on their responses for a **${interviewTitle}**.

### Evaluation Criteria
Evaluate the candidate based on the following criteria, using the rubric provided:

${formattedCriteria}

### Candidate's Responses
${formattedResponses}

### General Instructions
Your evaluation should include:
- **Overall Score**: An overall grade on a scale of 1 to 100.
- **Evaluation Scores**: Scores for each criterion on a scale of 1 to 10 and provide feedback for each criterion if there is no linked question base it off the other questions.
- **Strengths and Areas for Improvement**: Specific feedback highlighting areas where the candidate excelled or could improve.
- **Recommendations**: Suggestions for how the candidate could improve.
- **Mark**: Within "question_answer_feedback" for each mark for each answer should be marked out of ${maxScorePerQuestion} and ensure that the sum of all marks add up to "overall_grade".

### Guidelines
1. **Balanced Feedback**: Address both strengths and areas for improvement for each criterion, especially if the candidate performed variably across different questions.
2. **Avoid Generalizations**: Provide concrete examples from the candidate's answers to support your evaluations.
3. **Constructive Criticism**: Offer actionable feedback that the candidate can use to improve their performance.

### Output Format
Provide your evaluation in the following JSON format without any additional text.

\`\`\`json
{
  "overall_grade": 0,
  "evaluation_scores": [
    ${evaluationScoresTemplate}
  ],
  "strengths": "",
  "areas_for_improvement": "",
  "recommendations": "",
  "question_answer_feedback": [
    ${questionAnswerFeedbackTemplate}
  ]
}
\`\`\`

**Note**: 
-Ensure the JSON is properly formatted for parsing.`;
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
        model: 'gpt-4-turbo', // Use 'gpt-4' if preferred
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 3000,
        temperature: 0.5,
      });

      const aiMessage = completion.choices?.[0]?.message?.content;
      if (!aiMessage) {
        throw new Error('No content returned from OpenAI.');
      }
      console.log('OpenAI Response:', aiMessage); // Log the raw AI response
      return aiMessage;
    } catch (error) {
      if (attempt === retries) {
        // Log the error before throwing
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
      delay *= 2; // Exponential backoff
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
    // Enhanced error handling with categorization
    if (error.response) {
      // OpenAI API returned an error response
      console.error(
        'OpenAI API Error:',
        error.response.status,
        error.response.data,
      );
      return 'error';
    } else if (error.request) {
      // Request was made but no response received
      console.error('OpenAI API No Response:', error.request);
      return 'error';
    } else {
      // Other errors
      console.error('OpenAI API Error:', error.message);
      return 'error';
    }
  }
};

/**
 * Parses the AI's JSON response safely using Zod for validation
 */
const parseAIResponse = (aiResponse: string): FeedbackData => {
  try {
    let jsonString = '';

    // Attempt to extract JSON from code blocks first
    const jsonRegex = /```json([\s\S]*?)```/i;
    const match = aiResponse.match(jsonRegex);
    if (match && match[1]) {
      jsonString = match[1].trim();
    } else {
      // If no code block is found, attempt to extract JSON from the entire response
      // Remove any leading/trailing text that is not part of JSON
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

    // Parse the JSON string into a FeedbackData object
    const feedbackData = JSON.parse(jsonString);
    // Optional: Validate the structure of feedbackData here

    return feedbackData;
  } catch (error) {
    console.error('Error parsing AI response:', error.message);
    throw new Error('Failed to parse AI response into JSON.');
  }
};

/**
 * Main function to get interview feedback from OpenAI
 */
export const getInterviewFeedback = async (
  interview: Interview,
  evaluationCriteria: EvaluationCriteriaType[],
  interviewAnswersDetails: InterviewAnswerDetail[],
): Promise<FeedbackData | null> => {
  // Input Validation
  if (!interview.id.trim()) {
    throw new Error('Interview ID cannot be empty.');
  }

  if (!interview.title.trim()) {
    throw new Error('Interview Title cannot be empty.');
  }

  if (evaluationCriteria.length === 0) {
    throw new Error('Evaluation Criteria cannot be empty.');
  }

  if (interviewAnswersDetails.length === 0) {
    throw new Error('Interview Answers Details cannot be empty.');
  }

  // Ensure that each InterviewAnswerDetail has corresponding Evaluation Criteria
  for (const detail of interviewAnswersDetails) {
    if (!detail.evaluation_criteria_name.trim()) {
      throw new Error(
        `Evaluation criteria name is missing for question: "${detail.question}".`,
      );
    }
  }

  // Construct the prompt
  const prompt = constructPrompt(
    interview.title,
    evaluationCriteria,
    interviewAnswersDetails,
    interview.mode,
  );

  console.log('Prompt:', prompt);
  // // Determine maximum score per question
  // const numberOfQuestions = interviewAnswersDetails.length || 1; // Avoid division by zero
  // const maxTotalScore = 100;
  // const maxScorePerQuestion = Math.floor(maxTotalScore / numberOfQuestions);

  // Call OpenAI API
  const aiResponse = await callOpenAI(prompt);
  if (aiResponse === 'error') {
    return null;
  }
  const feedbackData = parseAIResponse(aiResponse);
  const interviewEvaluation = await insertInterviewEvaluation(
    interview.id,
    feedbackData,
  );
  console.log('Feedback Data:', feedbackData);

  return feedbackData;
};
