import { InterviewQuestion } from '@/types';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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
  - Stream a user-friendly string evalution only of the candidate's response to the current question. Ensure that all sentences have proper spacing between words, without any additional text, explanations, Markdown formatting, or code blocks.
  in the following format:
  Mark: [number]
  Summary: [string]
  AdviceforNextQuestion: [string]
  
**Note:**
- Ensure the JSON is properly formatted for parsing.
- If there is no next question, set "advice_for_next_question" to "N/A".
- Provide actionable and constructive advice to help the candidate improve.
`;
};

export async function POST(req: NextRequest) {
  const {
    skill,
    currentQuestion,
    currentAnswer,
    nextQuestion,
    interview_question_count,
  } = await req.json();

  // 2) Construct a prompt that instructs GPT to do the "two-part" format
  const prompt = constructQuestionFeedbackPrompt(
    skill,
    currentQuestion,
    currentAnswer,
    nextQuestion,
    interview_question_count,
  );

  // 3) Create streaming completion
  const stream = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    stream: true,
  });

  // Use a ReadableStream to forward all the chunks to the client.
  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        // chunk is of type ChatCompletionChunk
        const content = chunk?.choices?.[0]?.delta?.content || '';

        const sseBlock = `data: ${content}\n\n`;
        controller.enqueue(encoder.encode(sseBlock));
      }
      // When done
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new NextResponse(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
