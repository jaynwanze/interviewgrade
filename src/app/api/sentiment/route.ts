import { env, pipeline } from '@huggingface/transformers';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

// 📌 Fix the model path issue by ensuring it's correctly set
const MODEL_DIR = path.resolve(process.cwd(), 'models');

// ✅ Set the correct local path for the model
env.localModelPath = MODEL_DIR;
env.allowRemoteModels = false;

// Load the model once
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sentimentAnalyzer: any = null;

async function loadModel() {
  if (!sentimentAnalyzer) {
    console.log(`✅ Loading model from: ${MODEL_DIR}`);

    sentimentAnalyzer = await pipeline(
      'text-classification',
      'my_sentiment_analysis_model',
      {
        dtype: 'fp32',
      },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await loadModel(); // Ensure model is loaded

    const { text } = await req.json();
    if (!text) {
      return NextResponse.json(
        { error: 'Missing text input' },
        { status: 400 },
      );
    }

    // Run sentiment analysis
    const result = await sentimentAnalyzer(text, { return_all_scores: true });

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.error('❌ Sentiment analysis error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
