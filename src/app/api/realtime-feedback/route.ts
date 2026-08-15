import { EvaluationCriteriaType, InterviewQuestion } from '@/types';
import { createOpenAIClient } from '@/utils/openai/config';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const {
    skill,
    currentQuestion,
    currentAnswer,
    nextQuestion,
    interview_question_count,
    interview_evaluation_criterias,
  } = await req.json();

  try {
    const openai = createOpenAIClient();
    const systemMsg = buildSystemMessage(interview_evaluation_criterias ?? []);
    const userMsg = constructQuestionFeedbackPrompt(
      skill,
      currentQuestion,
      currentAnswer,
      nextQuestion,
      interview_question_count,
      interview_evaluation_criterias ?? [],
    );

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [systemMsg, userMsg],
      max_tokens: 150,
      temperature: 0.5,
      store: true,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const data = chunk.choices?.[0]?.delta?.content;
            if (data) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
              );
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          console.error('Legacy realtime feedback stream failed:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify(buildFallbackFeedback(nextQuestion != null))}\n\n`,
            ),
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(readableStream, {
      headers: streamHeaders('ready'),
    });
  } catch (error) {
    console.error(
      'Legacy realtime feedback request failed:',
      error instanceof Error ? error.message : error,
    );
    return feedbackUnavailableStream(nextQuestion != null);
  }
}

function feedbackUnavailableStream(hasNextQuestion: boolean) {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify(buildFallbackFeedback(hasNextQuestion))}\n\n`,
        ),
      );
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new NextResponse(body, { headers: streamHeaders('fallback') });
}

function buildFallbackFeedback(hasNextQuestion: boolean) {
  return `Practice Feedback\nScore (%):\n0/100%\n\nSummary: Your answer was saved successfully, but live AI feedback is temporarily unavailable.\nAdvice for Next Question: ${
    hasNextQuestion
      ? 'Continue to the next question and focus on a clear, specific example.'
      : 'N/A'
  }`;
}

function streamHeaders(status: 'ready' | 'fallback') {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-InterviewGrade-Feedback-Status': status,
  };
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
  - **Mark**: Assign a numerical score out of ${maxScorePerQuestion} based on the candidate's performance relative to the rubric.
  - **Summary**: Short/concise evaluation of the candidate's answer to the current question and evaluation criteria.
  - **Advice for Next Question**: Offer advice for how to answer the next question effectively.
  
  ### Output Format
  Provide only this plain-text structure:
  
     Practice Feedback
     Score (%):
     0/100%
  
     Summary: [some text]
     Advice for Next Question: [some text]
  
  - If there is no next question, set Advice for Next Question to N/A.
  - Do not invent facts missing from the candidate answer.
  - Score irrelevant, empty, or poor answers appropriately low.
  - Be actionable and constructive.
  `,
  };
}

function constructQuestionFeedbackPrompt(
  skill: string,
  currentQuestion: InterviewQuestion,
  currentAnswer: string,
  nextQuestion: InterviewQuestion | null,
  interview_question_count: number,
  intervieEvaluationsCriterias: EvaluationCriteriaType[],
) {
  void skill;
  void interview_question_count;
  void intervieEvaluationsCriterias;

  return {
    role: 'system' as const,
    content: `
  ### Current Question
  **Linked Evaluation Criteria**: ${currentQuestion.evaluation_criteria.name}
  
  **Question**: ${currentQuestion.text}
  
  **Answer**: "${currentAnswer}"
  
  ### Next Question
  ${nextQuestion ? `**Question**: ${nextQuestion.text}` : '**Question**: N/A'}
  `,
  };
}
