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
const FALLBACK_PDF_URL = `${process.env.NEXT_PUBLIC_SITE_URL}/test/05-versions-space.pdf`;

/**
 * Returns a Buffer from a given resume source.
 * If the resumeUrl starts with "http", it fetches the file from the network;
 * otherwise, it treats it as a local file path.
 */
async function getResumeBuffer(resumeUrl: string): Promise<Buffer> {
  console.log('NODE_ENV:', process.env.NODE_ENV);
  const trimmed = resumeUrl.trim().toLowerCase();

  // If it's already a remote URL, fetch it:
  if (trimmed.startsWith('http')) {
    const response = await fetch(resumeUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch from URL ${resumeUrl}. 
         Status: ${response.status} ${response.statusText}`,
      );
    }
    return Buffer.from(await response.arrayBuffer());
  }

  // If local path in PRODUCTION => fetch fallback PDF from /public/test
  if (process.env.NODE_ENV === 'production') {
    const response = await fetch(FALLBACK_PDF_URL);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch fallback PDF: ${FALLBACK_PDF_URL}. 
         Status: ${response.status} ${response.statusText}`,
      );
    }
    return Buffer.from(await response.arrayBuffer());
  }

  // Otherwise, local dev => read from filesystem
  if (!fs.existsSync(resumeUrl)) {
    throw new Error(`Local file does not exist: ${resumeUrl}`);
  }
  return fs.readFileSync(resumeUrl);
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
