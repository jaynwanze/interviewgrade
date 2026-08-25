import { describe, expect, it } from 'vitest';

import {
  buildPracticeContextBrief,
  practiceContextKindSchema,
} from './practice.document-generator';

const sourceText =
  'This source contains enough text to exercise the Practice context prompt builder safely.';

describe('Practice context generation', () => {
  it('accepts only supported context kinds', () => {
    expect(practiceContextKindSchema.parse('job-description')).toBe(
      'job-description',
    );
    expect(practiceContextKindSchema.parse('resume')).toBe('resume');
    expect(practiceContextKindSchema.parse('other')).toBe('other');
    expect(() => practiceContextKindSchema.parse('portfolio')).toThrow();
  });

  it('builds job-description guidance around role requirements, not participant facts', () => {
    const brief = buildPracticeContextBrief({
      sourceText,
      sourceLabel: 'role.txt',
      contextKind: 'job-description',
      instruction: 'Focus on stakeholder communication.',
    });

    expect(brief).toContain('job description');
    expect(brief).toContain('role responsibilities');
    expect(brief).toContain('Do not treat statements in the job description as facts');
    expect(brief).toContain('Creator instruction:');
    expect(brief).toContain('Focus on stakeholder communication.');
    expect(brief).toContain(sourceText);
  });

  it('keeps résumé generation grounded in source-supported personal experience', () => {
    const brief = buildPracticeContextBrief({
      sourceText,
      sourceLabel: 'resume.pdf',
      contextKind: 'resume',
    });

    expect(brief).toContain('résumé/CV');
    expect(brief).toContain('explicitly present in the source');
    expect(brief).toContain('Never invent employers');
    expect(brief).toContain('Do not score the résumé');
    expect(brief).toContain(sourceText);
  });

  it('keeps other source documents contextual without unsupported personal inference', () => {
    const brief = buildPracticeContextBrief({
      sourceText,
      sourceLabel: 'notes.txt',
      contextKind: 'other',
    });

    expect(brief).toContain('source-document');
    expect(brief).toContain('Do not infer unsupported personal facts');
  });
});
