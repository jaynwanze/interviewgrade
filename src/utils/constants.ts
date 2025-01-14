import { Database } from '@/lib/database.types';

export const INTERVIEW_PRACTICE_MODE = 'practice';
export const INTERVIEW_INTERVIEW_MODE = 'interview';
export const INTERVIEW_MODES: Database['public']['Enums']['interview_mode'][] =
    ['practice', 'interview'];
export const INTERVIEW_MODE_PRACTICE_DESCRIPTION =
    'Practice answering questions to improve your skills.';
export const INTERVIEW_MODE_INTERVIEW_DESCRIPTION =
    'Take a mock interview simualting a real life situations.';
