import { NextRequest, NextResponse } from 'next/server';

const apiKey = process.env.HUGGING_FACE_API_KEY;
const modelUrl = process.env.INTERVIEW_ANSWERS_SENTIMENT_MODEL_URL;
export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      throw new Error('Hugging Face API key not provided');
    }
    if (!modelUrl) {
      throw new Error('Hugging Face model URL not provided');
    }
    const body = await req.json();

    // Forward the request body to the Hugging Face API
    const response = await fetch(modelUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('Response from Hugging Face:', data);

    // Return the response with CORS headers
    return NextResponse.json(data, {
      status: response.ok ? 200 : response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error in proxy:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    },
  );
}
