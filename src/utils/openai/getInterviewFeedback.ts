'use server';

import {
  EvaluationCriteriaType,
  FeedbackData,
  InterviewEvaluation,
} from '@/types';

import { insertInterviewEvaluation } from '@/data/user/interviews';
import OpenAI from 'openai';

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
  questions: string[],
  answers: string[],
  evaluationCriteria: EvaluationCriteriaType[],
): string => {
  const formattedResponses = questions
    .map(
      (question, index) =>
        `**Question**: ${question}\n**Answer**: "${answers[index]}"`,
    )
    .join('\n\n');

  const formattedCriteria = evaluationCriteria
    .map(
      (criterion, index) =>
        `${index + 1}. **${criterion.name}**: ${criterion.description}`,
    )
    .join('\n');

  // Construct the evaluation scores template without type annotations
  const evaluationScoresTemplate = evaluationCriteria
    .map((criterion) => {
      return `{
      "id": "${criterion.id}",
      "name": "${criterion.name}",
      "percent": number,
      "feedback": "string"
    }`;
    })
    .join(',\n    ');

  // Construct the evaluation scores template without type annotations
  const questionAnswerFeedbackTemplate = questions
    .map((question, index) => {
      return `{
    "question": "${question}",
    "answer": "${answers[index]}",	
    "percent": number,
    "feedback": "string"
  }`;
    })
    .join(',\n    ');

  // Construct the prompt with enhanced instructions
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
- **Question Answer Feedback**: The grade and specific feedback based on corresponding evaluation criteria for each question and answer pair out of equal marks which add up overall score(grade).

**Guidelines:**

1. **Link Feedback to Specific Answers**: When evaluating each criterion, reference the specific answer related to that criterion. For example, if assessing "Problem Solving," mention how the candidate's answer to "How do you approach problems?" demonstrates their skills in that area.

2. **Balanced Feedback**: Ensure that both strengths and areas for improvement are addressed for each criterion, especially if the candidate performed variably across different questions.

3. **Avoid Generalizations**: Provide concrete examples from the candidate's answers to support your evaluations.

**Output Format**:
Please present your evaluation in the following JSON format without any additional text:

\`\`\`json
{
  "overall_score": number,
  "evaluation_scores": [
    ${evaluationScoresTemplate}
  ],
  "strengths": "string",
  "areas_for_improvement": "string",
  "recommendations": "string",
  "question_answer_feedback": [
    ${questionAnswerFeedbackTemplate}
  ]
}
\`\`\`

**Note**: Ensure the JSON is properly formatted for parsing.
`;

  return prompt;
};

/**
 * Calls the OpenAI API with the constructed prompt
 */
const callOpenAI = async (prompt: string): Promise<string> => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.7,
    });

    if (
      !completion.choices ||
      completion.choices.length === 0 ||
      !completion.choices[0].message.content
    ) {
      throw new Error('No completion choices returned from OpenAI.');
    }

    return completion.choices[0].message.content;
  } catch (error) {
    // Handle specific OpenAI API errors
    if (error.response) {
      console.error(
        'OpenAI API Error:',
        error.response.status,
        error.response.data,
      );
      throw new Error(
        `OpenAI API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
      );
    } else {
      console.error('OpenAI API Error:', error.message);
      throw new Error(`OpenAI API Error: ${error.message}`);
    }
  }
};

/**
 * Parses the AI's JSON response safely
 */
const parseAIResponse = (aiResponse: string): FeedbackData => {
  try {
    // Use a regex to extract JSON from code blocks
    const jsonRegex = /```json([\s\S]*?)```/;
    const match = aiResponse.match(jsonRegex);

    if (!match || match.length < 2) {
      throw new Error('JSON response not found in the AI output.');
    }

    const jsonString = match[1].trim();

    const feedbackData: FeedbackData = JSON.parse(jsonString);

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
  interviewId: string,
  interviewTitle: string,
  questions: string[],
  answers: string[],
  evaluationCriteria: EvaluationCriteriaType[],
): Promise<FeedbackData> => {
  if (questions.length !== answers.length) {
    throw new Error('The number of questions and answers must be the same.');
  }

  const prompt = constructPrompt(
    interviewTitle,
    questions,
    answers,
    evaluationCriteria,
  );

  const aiResponse = await callOpenAI(prompt);
  const feedbackData = parseAIResponse(aiResponse);
  await insertInterviewEvaluation(interviewId, feedbackData);
  // insert into answer table feedback and score

  console.log(feedbackData);

  return feedbackData;
};
