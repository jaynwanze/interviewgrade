'use server';

import { insertInterviewEvaluation } from '@/data/user/interviews';
import {
  EvaluationCriteriaType,
  FeedbackData,
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
  // Format the evaluation criteria
  const formattedCriteria = evaluationCriteria
    .map(
      (criterion, index) =>
        `${index + 1}. **${criterion.name}**: ${criterion.description}`,
    )
    .join('\n');

  // Format the candidate's responses
  const formattedResponses = interviewAnswersDetails
    .map((detail) => {
      return `**Question**: ${detail.question}\n**Answer**: "${detail.answer}"\n**Evaluation Criteria**: ${detail.evaluation_criteria_name}`;
    })
    .join('\n\n');

  // Construct the evaluation scores and feedback templates without type annotations
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

  // Determine the max score per question to align with overall score
  const numberOfQuestions = interviewAnswersDetails.length;
  const maxTotalScore = 100;
  const maxScorePerQuestion = Math.floor(maxTotalScore / numberOfQuestions);

  // Construct the prompt
  const prompt = `### Interview Context
You are an AI evaluation assistant for an interview simulation platform. The following interview was conducted for a **${interviewTitle}**.

### Evaluation Criteria
Please evaluate the candidate based on the following criteria:

${formattedCriteria}

### Candidate's Responses
${formattedResponses}

### Instructions
Provide a detailed evaluation of the candidate's performance based on the above criteria. Your response should include:

- **Overall Score**: An overall grade on a scale of 1 to 100 (1 = Poor, 100 = Excellent).
- **Evaluation Scores**: Individual scores for each evaluation criterion (on a scale of 1 to 10).
- **Strengths**: Specific areas where the candidate excelled.
- **Areas for Improvement**: Specific areas where the candidate could improve.
- **Recommendations**: Any suggestions or next steps for the candidate.
- **Question Answer Feedback**: Grades which add up to the overall score and specific feedback for each question and answer pair.

**Guidelines:**

1. **Link Feedback to Specific Answers**: Reference specific answers related to each criterion. For example, when evaluating a specific criteria, mention how the candidate's answer to the linked question demonstrates their skills in that area.

2. **Balanced Feedback**: Address both strengths and areas for improvement for each criterion, especially if the candidate performed variably across different questions.

3. **Avoid Generalizations**: Provide concrete examples from the candidate's answers to support your evaluations.

**Output Format**:
Provide your evaluation in the following JSON format without any additional text. Ensure that the sum of all question scores in "question_answer_feedback" equals the "overall_score". Each question's maximum score is ${maxScorePerQuestion}.

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

**Note**: Ensure the JSON is properly formatted for parsing. The sum of all question scores in "question_answer_feedback" should equal the "overall_score". Each question's maximum score is ${maxScorePerQuestion}.
`;

  return prompt;
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
        model: 'gpt-3.5-turbo', //use for now
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
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
      throw new Error(
        `OpenAI API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
      );
    } else if (error.request) {
      // Request was made but no response received
      console.error('OpenAI API No Response:', error.request);
      throw new Error('OpenAI API did not respond.');
    } else {
      // Other errors
      console.error('OpenAI API Error:', error.message);
      throw new Error(`OpenAI API Error: ${error.message}`);
    }
  }
};

/**
 * Parses the AI's JSON response safely using Zod for validation
 */
const parseAIResponse = (aiResponse: string): FeedbackData => {
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
  interviewId: string,
  interviewTitle: string,
  evaluationCriteria: EvaluationCriteriaType[],
  interviewAnswersDetails: InterviewAnswerDetail[],
): Promise<FeedbackData> => {
  // Input Validation
  if (!interviewId.trim()) {
    throw new Error('Interview ID cannot be empty.');
  }

  if (!interviewTitle.trim()) {
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
    interviewTitle,
    evaluationCriteria,
    interviewAnswersDetails,
  );

  // Call OpenAI API
  const aiResponse = await callOpenAI(prompt);
  const feedbackData = parseAIResponse(aiResponse);
  await insertInterviewEvaluation(interviewId, feedbackData);

  // Optionally: Insert feedback and scores into the answers table if applicable

  console.log('Feedback Data:', feedbackData);

  return feedbackData;
};
