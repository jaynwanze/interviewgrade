'use server';

import {
  insertInterviewEvaluation,
  updateInterviewAnalytics,
} from '@/data/user/interviews';
import {
  EvaluationCriteriaType,
  FeedbackData,
  Interview,
  InterviewAnswerDetail,
} from '@/types';
import OpenAI from 'openai';
import { FeedbackDataSchema } from '../zod-schemas/openAiFeedback';

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
  "score": 0,
  "feedback": ""
}`,
    )
    .join(',\n    ');

  // Determine maximum score per question
  const numberOfQuestions = interviewAnswersDetails.length || 1; // Avoid division by zero
  const maxTotalScore = 100;
  const maxScorePerQuestion = Math.floor(maxTotalScore / numberOfQuestions);

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
- **Evaluation Scores**: Scores for each criterion on a scale of 1 to 10.
- **Strengths and Areas for Improvement**: Specific feedback highlighting areas where the candidate excelled or could improve.
- **Recommendations**: Suggestions for how the candidate could improve.
- **Question Answer Feedback**: Grades which add up to the overall score and specific feedback for each question and answer pair.

### Guidelines
1. **Link Feedback to Specific Answers**: Reference specific answers related to each criterion. For example, when evaluating a specific criterion, mention how the candidate's answer to the linked question demonstrates their skills in that area.
2. **Balanced Feedback**: Address both strengths and areas for improvement for each criterion, especially if the candidate performed variably across different questions.
3. **Avoid Generalizations**: Provide concrete examples from the candidate's answers to support your evaluations.
4. **Scoring Constraints**:
   - The **sum of all question scores** in "question_answer_feedback" **must equal** the "overall_score".
   - Each question's **maximum score is ${maxScorePerQuestion}**.

### Output Format
Provide your evaluation in the following JSON format:

\`\`\`json
{
  "overall_score": 0,
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

**Notes**:
- Ensure the JSON is properly formatted for parsing.
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
        //model: 'gpt-4', // cost .09 per completion
        model: 'gpt-4', //use for now
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 3000,
        temperature: 0.5,
      });

      const aiMessage = completion.choices?.[0]?.message?.content;
      if (!aiMessage) {
        throw new Error('No content returned from OpenAI.');
      }

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
const parseAIResponse = (
  aiResponse: string,
  maxScorePerQuestion,
): FeedbackData => {
  try {
    // Attempt to parse JSON directly
    const jsonStart = aiResponse.indexOf('{');
    const jsonEnd = aiResponse.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('JSON object not found in the AI response.');
    }

    const jsonString = aiResponse.substring(jsonStart, jsonEnd + 1);

    const parsed = JSON.parse(jsonString);
    const feedbackData = FeedbackDataSchema.parse(parsed); // Validates the structure

    // Calculate the sum of question scores
    const questionScoresSum = feedbackData.question_answer_feedback.reduce(
      (sum, qa) => sum + qa.score,
      0,
    );

    if (questionScoresSum !== feedbackData.overall_score) {
      throw new Error(
        `Sum of question scores (${questionScoresSum}) does not equal the overall score (${feedbackData.overall_score}).`,
      );
    }

    // Ensure no question exceeds the maximum score
    for (const qa of feedbackData.question_answer_feedback) {
      if (qa.score > maxScorePerQuestion) {
        throw new Error(
          `Question "${qa.question}" has a score of ${qa.score}, which exceeds the maximum allowed score of ${maxScorePerQuestion}.`,
        );
      }
    }

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
  );

  // Determine maximum score per question
  const numberOfQuestions = interviewAnswersDetails.length || 1; // Avoid division by zero
  const maxTotalScore = 100;
  const maxScorePerQuestion = Math.floor(maxTotalScore / numberOfQuestions);

  // Call OpenAI API
  const aiResponse = await callOpenAI(prompt);
  if (aiResponse === 'error') {
    return null;
  }
  const feedbackData = parseAIResponse(aiResponse, maxScorePerQuestion);
  const interviewEvaluation = await insertInterviewEvaluation(
    interview.id,
    feedbackData,
  );
  if (interviewEvaluation) {
    await updateInterviewAnalytics(interview, interviewEvaluation);
  }
  console.log('Feedback Data:', feedbackData);

  return feedbackData;
};
