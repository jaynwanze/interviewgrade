import { EvaluationCriteriaType, InterviewQuestion } from '@/types';
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
 * Handles the POST request
 */
export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const {
    skill,
    currentQuestion,
    currentAnswer,
    nextQuestion,
    interview_question_count,
    interview_evaluation_criterias,
  } = await req.json();

  try {
    const systemMsg = buildSystemMessage(interview_evaluation_criterias);
    const userMsg = constructQuestionFeedbackPrompt(
      skill,
      currentQuestion,
      currentAnswer,
      nextQuestion,
      interview_question_count,
      interview_evaluation_criterias,
    );

    const streamPromise = openai.chat.completions.create({
      model: 'gpt-4o-mini', // or gpt-3.5-turbo
      messages: [systemMsg, userMsg],
      max_tokens: 150, //
      temperature: 0.5,
      store: true,
      stream: true,
    });

    const stream = await streamPromise;
    if (!stream) {
      console.error('No content from AI');
      return NextResponse.json(
        { error: 'No content from AI' },
        { status: 500 },
      );
    }

    const headers = new Headers();
    headers.set('Content-Type', 'text/event-stream');
    headers.set('Cache-Control', 'no-cache');
    headers.set('Connection', 'keep-alive');

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const data = chunk.choices?.[0]?.delta?.content;
          if (data) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
            );
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
    return new NextResponse(readableStream, { headers });
  } catch (error) {
    console.error('Error fetching feedback:', error.message || error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

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
  You are an AI interviewer providing short feedback. 
  Rubric (score out of 100):
  ${formattedCriteria}
  
  ### Instructions
  Your evaluation should include:
  - **Mark**: Assign a numerical score out of ${maxScorePerQuestion} based on the candidate's performance relative to the rubric. Ensure that the mark reflects the degree to which the candidate meets the criteria outlined in the rubric.
  - **Summary**: Short/Concise evalaution of the candidate's answer to the current question and based off the evalution criteria.
  - **Advice for Next Question**: Offer advice for how to answer the next question effectively.
  
  ### Output Format
  Provide your evaluation in the following this format without any additional text.
  
  1) A user-friendly block of text (plain text, no code fences) that streams. 
     It should be formatted like:
  
     Practice Feedback
     Score (%):
     0/100%
  
     Summary: [some text]
     Advice for Next Question: [some text]
  
     This block should be typed out gradually so the user can see it live.
  
  **Note:**
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
  `,
  };
}
