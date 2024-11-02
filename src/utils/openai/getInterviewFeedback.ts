'use server';

import { EvaluationCriteriaType, InterviewEvaluation } from '@/types';
import axios from 'axios';

const openAiKey = process.env.OPENAI_SECRET_KEY;
if (!openAiKey) {
  throw new Error('OpenAI API key is missing');
}

// Function to get interview feedback from OpenAI
export const getInterviewFeedback = async (
  interviewTitle: string,
  questions: string[],
  answers: string[],
  evaluationCriteria: EvaluationCriteriaType[],
): Promise<InterviewEvaluation> => {
  // Construct the formatted responses
  const formattedResponses = questions
    .map((question, index) => {
      return `**Question**: ${question}\n**Answer**: "${answers[index]}"`;
    })
    .join('\n\n');

  // Construct the evaluation criteria section
  const formattedCriteria = evaluationCriteria
    .map((criterion, index) => {
      return `${index + 1}. **${criterion.name}**: ${criterion.description}`;
    })
    .join('\n');

  // Construct a placeholder for evaluation_scores in the Output Format
  const evaluationScoresPlaceholder = evaluationCriteria
    .map((criterion) => {
      return `{
        "id": "${criterion.id}",
        "name": "${criterion.name}",
        "score": number,
        "feedback": "string"
      }`;
    })
    .join(',\n    ');

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

- **Overall Score**: An overall rating on a scale of 1 to 10 (1 = Poor, 10 = Excellent).
- **Evaluation Scores**: Individual scores for each evaluation criterion (on a scale of 1 to 10).
- **Strengths**: Specific areas where the candidate excelled.
- **Areas for Improvement**: Specific areas where the candidate could improve.
- **Recommendations**: Any suggestions or next steps for the candidate.

**Output Format**:
Please present your evaluation in the following JSON format:

\`\`\`json
{
  "overall_score": number,
  "evaluation_scores": [
    ${evaluationScoresPlaceholder}
  ],
  "strengths": "string",
  "areas_for_improvement": "string",
  "recommendations": "string"
}
\`\`\`

**Note**: Ensure the JSON is properly formatted for parsing.

Thank you!`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 750,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiKey}`, // Use Bearer token for authorization
        },
      },
    );

    // Extract the AI's response
    const aiResponse: string = response.data.choices[0].message.content;

    // Parse the JSON from the AI's response
    const jsonStartIndex = aiResponse.indexOf('{');
    const jsonEndIndex = aiResponse.lastIndexOf('}') + 1;
    const jsonString = aiResponse.substring(jsonStartIndex, jsonEndIndex);

    const feedbackData: InterviewEvaluation = JSON.parse(jsonString);
    return feedbackData;
  } catch (error) {
    console.error('Error fetching feedback from OpenAI:', error);
    throw new Error('Failed to fetch feedback');
  }
};
