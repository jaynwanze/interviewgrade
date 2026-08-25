import 'server-only';

import type { CoachGroundingContext } from './coach.service';

export function buildFollowUpPracticeBrief(
  grounding: CoachGroundingContext,
): string {
  const evaluation = grounding.sessionEvaluation;

  if (!evaluation) {
    throw new Error('A completed session evaluation is required for follow-up Practice generation.');
  }

  const criterionLines = evaluation.criterionScores
    .slice()
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((criterion) => `- ${criterion.criterionName}: ${criterion.score}/100`);

  const improvementLines = evaluation.improvements
    .slice(0, 4)
    .map((item) => `- ${item}`);

  return [
    `Create a focused follow-up interview Practice for: ${grounding.practiceTitle}.`,
    `Original Practice scenario: ${grounding.scenario}`,
    'The goal is to help the participant practise the weakest areas identified by the completed report. Do not copy the previous questions verbatim. Create fresh questions that target the same underlying skills.',
    'Do not invent personal experience, employers, achievements, or facts about the participant. Keep prompts answerable from their own real experience.',
    criterionLines.length > 0 ? `LOWEST-SCORING CRITERIA\n${criterionLines.join('\n')}` : '',
    improvementLines.length > 0 ? `IMPROVEMENT AREAS\n${improvementLines.join('\n')}` : '',
    evaluation.recommendation
      ? `REPORT RECOMMENDATION\n${evaluation.recommendation}`
      : '',
    'Return the normal editable InterviewGrade Practice draft with a useful rubric. Do not auto-publish it.',
  ]
    .filter(Boolean)
    .join('\n\n');
}
