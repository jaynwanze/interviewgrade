import { NextRequest, NextResponse } from 'next/server';
import { env } from 'process';

export async function POST(req: NextRequest) {
  try {
    const { inputs } = (await req.json()) as { inputs: string };

    // in fetchSentiment()
    const res = await fetch(env.INTERVIEW_ANSWERS_SENTIMENT_MODEL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.HUGGING_FACE_API_KEY}`,
      },
      body: JSON.stringify({ inputs: inputs }),
    });

    if (!res.ok) {
      throw new Error(`Error: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log('HF inference response', data);

    return NextResponse.json(data, {
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
