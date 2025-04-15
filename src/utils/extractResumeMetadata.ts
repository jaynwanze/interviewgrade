'use server';

import { Buffer } from 'buffer';
import fs from 'fs';
import OpenAI from 'openai';
import pdfParse from 'pdf-parse';

import {
  ResumeMetadata,
  resumeMetadataSchema,
} from './zod-schemas/resumeMetaDataSchema';

export interface Experience {
  jobTitle: string;
  company: string;
  startDate?: string;
  endDate?: string | null;
}

/**
 * Returns a Buffer from a given resume source.
 * If the resumeUrl starts with "http", it fetches the file from the network;
 * otherwise, it treats it as a local file path.
 */
export async function getResumeBuffer(resumeUrl: string): Promise<Buffer> {
  const trimmedUrl = resumeUrl.trim();
  // This is the public URL served by Next.js from your `public/` folder
  const testResumeUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/test/05-versions-space.pdf`;

  // If it's already a remote URL
  if (trimmedUrl.toLowerCase().startsWith('http')) {
    const response = await fetch(trimmedUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch resume from URL: ${trimmedUrl}. Status: ${response.status} ${response.statusText}`
      );
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } else {
    // If we're in production, read from a public URL instead of local
    if (process.env.NODE_ENV === 'production') {
      // fetch from that public URL in production:
      const response = await fetch(testResumeUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch test resume PDF from ${testResumeUrl}: ${response.status} ${response.statusText}`
        );
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    // Otherwise, in dev mode we can read from the local filesystem path
    if (!fs.existsSync(trimmedUrl)) {
      throw new Error(`Local file does not exist: ${trimmedUrl}`);
    }
    return fs.readFileSync(trimmedUrl);
  }
}

/**
 * Extracts text from a PDF buffer using pdf-parse.
 */
export async function extractTextFromPdf(fileBuffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(fileBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}

/**
 * Calls OpenAI's API with a prompt that instructs it to extract structured resume metadata.
 */
export async function getOpenAIExtractionResponse(
  text: string,
): Promise<string> {
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

  const prompt = `
  Extract the following information from the resume text below and output concise JSON in this format. For each experience/project description, limit to 1-2 sentences or ~40 words:
  
  {
    "skills": [array of strings],
    "experiences": [
      {
        "jobTitle": string,
        "company": string,
        "startDate": string or null,
        "endDate": string or null,
        "description": "a concise summary"
      }
    ],
    "education": string,
    "certifications": [array of strings],
    "projects": [
      {
        "title": string,
        "description": "a concise summary",
        "link": string or null
      }
    ]
  }
  
  Resume Text:
  ${text}
  
  Do not exceed 1-2 sentences for each description. Output valid JSON, no extra commentary.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 1500,
    });
    const output = response.choices?.[0]?.message?.content;
    if (!output) {
      throw new Error('No output received from OpenAI API.');
    }
    return output;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

/**
 * Extracts structured resume metadata using OpenAI.
 * Steps:
 */
export async function extractResumeMetadataViaOpenAI(
  fileBuffer: Buffer,
): Promise<ResumeMetadata> {
  // Step 1: Extract text from the PDF.
  const text = await extractTextFromPdf(fileBuffer);

  // Step 2: Call OpenAI's API to get a structured JSON response.
  const openAIResponse = await getOpenAIExtractionResponse(text);
  console.log('OpenAI response:', openAIResponse);

  // Step 3: Parse the response as JSON.
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(openAIResponse);
  } catch (error) {
    // If the output is wrapped in a code block, extract it.
    const match = openAIResponse.match(/```json([\s\S]*?)```/);
    if (match && match[1]) {
      try {
        parsedJson = JSON.parse(match[1].trim());
      } catch (jsonError) {
        console.error('Error parsing JSON from code block:', jsonError);
        throw new Error('Failed to parse JSON from OpenAI response.');
      }
    } else {
      console.error(
        'OpenAI response could not be parsed as JSON:',
        openAIResponse,
      );
      throw new Error('Failed to parse OpenAI response as JSON.');
    }
  }

  // Step 4: Validate the parsed JSON using Zod.
  try {
    const metadata = resumeMetadataSchema.parse(parsedJson);
    return metadata;
  } catch (validationError) {
    console.error('Validation error with extracted metadata:', validationError);
    throw validationError;
  }
}

/**
 * Fetches the resume from a URL (or local file), converts it to a Buffer,
 * and extracts resume metadata using OpenAI.
 */
export async function extractResumeMetadataFromUrl(
  resumeUrl: string,
): Promise<ResumeMetadata> {
  const fileBuffer = await getResumeBuffer(resumeUrl);
  const metadata = await extractResumeMetadataViaOpenAI(fileBuffer);
  return metadata;
}
