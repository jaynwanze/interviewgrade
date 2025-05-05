import { InferenceClient } from '@huggingface/inference';
import { NextRequest, NextResponse } from 'next/server';

const hf = new InferenceClient(process.env.HF_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { inputs } = (await req.json()) as { inputs: string };

    const result = await hf.textClassification({
      model: 'jaynwanze/interview_answers_sentiment_model',
      inputs,
      parameters: {
        wait_for_model: true,
      },
    });

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'No result from Hugging Face' },
        { status: 500 },
      );
    }

    return NextResponse.json(result, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    console.error('HF inference error', err);
    return NextResponse.json(
      { error: err.message ?? 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    },
  );
}
