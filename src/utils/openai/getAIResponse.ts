'use server';

import { Interview, InterviewEvaluation } from '@/types';
import OpenAI from 'openai';

// Initialize OpenAI API
if (!process.env.OPENAI_SECRET_KEY) {
  throw new Error('Missing OpenAI API key');
}
const openai = new OpenAI({
  apiKey: process.env.OPENAI_SECRET_KEY,
});

export const getAIResponse = async (
  interview: Interview,
  evaluation: InterviewEvaluation,
  userQuestion: string,
  conversationHistory: Array<{
    sender: 'system' | 'user' | 'assistant';
    text: string;
  }>,
) => {
  try {
    if (!interview || !evaluation) {
      throw new Error('Interview or evaluation not found');
    }

    if (!userQuestion) {
      throw new Error('User question is required');
    }

    const modeDisplayString =
      interview.mode === 'interview' ? 'mock interview' : 'practice session';

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      // Prepare the prompt with conversation history
      messages: [
        {
          role: 'system',
          content: `You are an AI interview coach for mock interview AI platform. The user recently completed an ${modeDisplayString} with the following evaluation:
            - Overall Rating: ${evaluation.overall_grade}
            - Strengths: ${evaluation.strengths}
            - Areas for Improvement: ${evaluation.areas_for_improvement}
            - Recommendations: ${evaluation.recommendations}
            - Question Answer Feedback: ${evaluation.question_answer_feedback}

            Provide:
            --Short concise feedback (1-3 sentences).
            --Avoid lengthy explanations.
            --Focus on key points.
            `,
        },
        ...conversationHistory.map((msg) => ({
          role: msg.sender as 'system' | 'user' | 'assistant',
          content: msg.text,
        })),
        {
          role: 'user',
          content: userQuestion,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    // Return the AI's response
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error fetching AI response:', error);
    return 'Sorry, I encountered an error. Please try again.';
  }
};
