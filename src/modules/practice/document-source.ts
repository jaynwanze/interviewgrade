import 'server-only';

import path from 'node:path';

import pdfParse from 'pdf-parse';

export const MAX_PRACTICE_DOCUMENT_BYTES = 5 * 1024 * 1024;
export const MAX_PRACTICE_SOURCE_CHARACTERS = 25_000;
export const MIN_PRACTICE_SOURCE_CHARACTERS = 40;

export type PracticeDocumentErrorCode =
  | 'unsupported-type'
  | 'too-large'
  | 'empty'
  | 'too-much-text'
  | 'parse-failed';

export class PracticeDocumentError extends Error {
  constructor(
    public readonly code: PracticeDocumentErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'PracticeDocumentError';
  }
}

export type ExtractedPracticeDocument = {
  filename: string;
  text: string;
};

export async function extractPracticeDocument(
  file: File,
): Promise<ExtractedPracticeDocument> {
  if (file.size <= 0) {
    throw new PracticeDocumentError('empty', 'The uploaded document is empty.');
  }

  if (file.size > MAX_PRACTICE_DOCUMENT_BYTES) {
    throw new PracticeDocumentError(
      'too-large',
      'The uploaded document is larger than 5 MB.',
    );
  }

  const filename = sanitizeFilename(file.name);
  const extension = path.extname(filename).toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  let extractedText: string;

  try {
    if (extension === '.pdf' && isAllowedMime(file.type, 'application/pdf')) {
      // `pdf-parse` is externalized in Next.js. Use the same static CommonJS
      // interop path as the existing resume parser rather than relying on the
      // shape of a dynamic import in Vercel serverless bundles.
      const parsed = await pdfParse(buffer);
      extractedText = parsed.text;
    } else if (extension === '.txt' && isAllowedMime(file.type, 'text/plain')) {
      extractedText = buffer.toString('utf8');
    } else {
      throw new PracticeDocumentError(
        'unsupported-type',
        'Only PDF and TXT files are supported in this first document release.',
      );
    }
  } catch (error) {
    if (error instanceof PracticeDocumentError) {
      throw error;
    }

    console.error(
      'extractPracticeDocument: PDF/text parsing failed',
      error instanceof Error
        ? { name: error.name, message: error.message }
        : String(error),
    );

    throw new PracticeDocumentError(
      'parse-failed',
      'InterviewGrade could not read text from that document.',
    );
  }

  const text = normalizeExtractedText(extractedText);

  if (text.length < MIN_PRACTICE_SOURCE_CHARACTERS) {
    throw new PracticeDocumentError(
      'empty',
      'The document did not contain enough extractable text. Scanned PDFs are not supported yet.',
    );
  }

  if (text.length > MAX_PRACTICE_SOURCE_CHARACTERS) {
    throw new PracticeDocumentError(
      'too-much-text',
      'The extracted document text is too long. Use a shorter source document; InterviewGrade will not silently truncate it.',
    );
  }

  return { filename, text };
}

function isAllowedMime(actual: string, expected: string) {
  // Some browsers omit a MIME type for local text files. The extension is still
  // validated above; reject a conflicting MIME type rather than trusting it.
  return actual === '' || actual === expected;
}

function sanitizeFilename(filename: string) {
  const basename = path.basename(filename.trim()).slice(0, 180);
  return basename || 'document';
}

function normalizeExtractedText(text: string) {
  return text
    .split(String.fromCharCode(0))
    .join('')
    .replace(/\r\n?/g, '\n')
    .replace(/[\t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
