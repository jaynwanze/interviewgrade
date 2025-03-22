'use server';

import OpenAI from 'openai';
import { z } from 'zod';

import { updateCandidateSummary } from '@/data/user/candidate';
import { getCandidateUserProfile } from '@/data/user/user';
import { Candidate } from '@/types';

const openAiKey = process.env.OPENAI_SECRET_KEY;

if (!openAiKey) {
    throw new Error(
        'OpenAI API key is missing. Please set OPENAI_SECRET_KEY in your environment variables.',
    );
}

const openai = new OpenAI({
    apiKey: openAiKey,
});


const constructCandidateSummaryPrompt = (candidate: Candidate) => {
    return `
You are an AI assistant helping a hiring manager quickly understand the core profile and progress of a job candidate. 

Below is the candidate’s information:
- **Role**: ${candidate.role}
- **Industry**: ${candidate.industry}
- **Location**: ${candidate.city}, ${candidate.country}
- **Existing Summary**: ${candidate.summary ? candidate.summary : 'Not provided'}
- **Interview Skill Stats**: ${JSON.stringify(candidate.interview_skill_stats, null, 2)}
- **Practice Skill Stats**: ${JSON.stringify(candidate.practice_skill_stats, null, 2)}

**Task**:
1. Synthesize this information into a concise overview (2-4 sentences).
2. Highlight the candidate’s current skill level, notable achievements, and recent progress based on their interview and practice stats (if available).
3. Present the summary in a way that an employer can quickly read and get a sense of the candidate’s suitability.

**Output**:
Return your answer **exclusively** in the following JSON format (no markdown):
\`\`\`json
{
  "candidate_summary": ""
}
\`\`\`
Make sure the summary is clear, professional, and under 100 words.
`;
};

// ============ 3. Helper: Call OpenAI with Retries ==============
const callOpenAIWithRetries = async (
    prompt: string,
    retries = 3,
    delay = 1000,
): Promise<string> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 500,
                temperature: 0.7,
            });

            const aiMessage = completion.choices?.[0]?.message?.content;
            if (!aiMessage) {
                throw new Error('No content returned from OpenAI.');
            }

            return aiMessage;
        } catch (error) {
            if (attempt === retries) {
                console.error(
                    `OpenAI API call failed after ${retries} attempts:`,
                    error,
                );
                throw error;
            }
            console.warn(
                `OpenAI API call failed on attempt ${attempt}. Retrying in ${delay}ms...`,
                error,
            );
            await new Promise((res) => setTimeout(res, delay));
            delay *= 2; // Exponential backoff
        }
    }
    throw new Error('Failed to call OpenAI API after multiple attempts.');
};

const CandidateSummarySchema = z.object({
    candidate_summary: z.string(),
});


const parseCandidateSummary = (aiResponse: string) => {
    let jsonString = '';

    // Attempt to extract JSON from triple backticks
    const jsonRegex = /```json([\s\S]*?)```/i;
    const match = aiResponse.match(jsonRegex);

    if (match && match[1]) {
        jsonString = match[1].trim();
    } else {
        // If the model didn't return a code block, attempt fallback parsing
        const firstBraceIndex = aiResponse.indexOf('{');
        const lastBraceIndex = aiResponse.lastIndexOf('}');
        if (firstBraceIndex !== -1 && lastBraceIndex !== -1) {
            jsonString = aiResponse
                .substring(firstBraceIndex, lastBraceIndex + 1)
                .trim();
        } else {
            throw new Error('No JSON object found in the AI response.');
        }
    }

    const parsedJson = JSON.parse(jsonString);
    const result = CandidateSummarySchema.parse(parsedJson);
    return result;
};

export const getCandidateSummary = async (
    candidateId: string,
): Promise<string> => {
    // 1) Fetch candidate from DB
    const candidate = await getCandidateUserProfile(candidateId);
    if (!candidate) {
        throw new Error('Candidate not found.');
    }

    // 2) Construct prompt
    const prompt = constructCandidateSummaryPrompt(candidate);

    // 3) Call OpenAI
    const aiResponse = await callOpenAIWithRetries(prompt);

    // 4) Parse & validate
    const { candidate_summary } = parseCandidateSummary(aiResponse);

    // 5) (Optional) Update DB with new summary
    await updateCandidateSummary(candidateId, candidate_summary);

    // Return the new summary
    return candidate_summary;
};
