import 'server-only';

import { randomUUID } from 'node:crypto';

import type {
  PracticeQuestion,
  PracticeVersion,
  RubricCriterion,
} from '@/modules/practice/practice.schema';
import { createPublicSessionService } from '@/modules/session/session.service';
import type {
  Session,
  SessionResponse,
} from '@/modules/session/session.schema';
import {
  RESPONSE_EVALUATION_MODEL,
  RESPONSE_PROMPT_VERSION,
  generateResponseEvaluation,
  roundScore,
} from './evaluation.generator';
import { DrizzleEvaluationRepository } from './evaluation.repository';
import {
  responseEvaluationSchema,
  sessionEvaluationSchema,
  type EvaluationRepository,
  type ResponseEvaluation,
  type SessionEvaluation,
} from './evaluation.schema';

// The persisted result shape is unchanged, so existing v1 reports remain
// readable. Model/aggregation metadata below records the mapping-aware behavior.
export const RESPONSE_EVALUATION_SCHEMA_VERSION = 'response-rubric-v1';
export const SESSION_EVALUATION_SCHEMA_VERSION = 'session-rubric-v1';
export const SESSION_AGGREGATION_VERSION =
  'session-aggregate-v3-rubric-weighted';

export type EvaluatedResponse = {
  response: SessionResponse;
  question: PracticeQuestion;
  evaluation: ResponseEvaluation;
};

export type EvaluationReport = {
  session: Session;
  practiceVersion: PracticeVersion;
  sessionEvaluation: SessionEvaluation;
  responses: EvaluatedResponse[];
};

export class EvaluationService {
  constructor(private readonly repository: EvaluationRepository) {}

  async getOrCreateReport(sessionId: string): Promise<EvaluationReport> {
    const sessionService = createPublicSessionService();
    const context = await sessionService.getContext(sessionId);

    if (!context) {
      throw new Error(`Session ${sessionId} was not found.`);
    }
    if (context.session.status !== 'completed') {
      throw new Error('A session must be completed before its final report is evaluated.');
    }

    const latestResponses = selectLatestAttempts(context.responses);
    if (latestResponses.length === 0) {
      throw new Error('This completed session has no saved responses to evaluate.');
    }

    assertRuntimeRubric(context.practiceVersion);

    const evaluatedResponses: EvaluatedResponse[] = [];
    for (const response of latestResponses) {
      const question = findQuestion(context.practiceVersion, response);
      let evaluation = await this.repository.getResponseEvaluation(
        response.id,
        RESPONSE_EVALUATION_SCHEMA_VERSION,
      );

      if (!evaluation) {
        const mappedRubric = rubricForQuestion(context.practiceVersion, question);
        const generated = await generateResponseEvaluation({
          practiceTitle: context.practiceVersion.snapshot.title,
          scenario: context.practiceVersion.snapshot.scenario,
          question,
          response,
          rubricCriteria: mappedRubric,
        });

        evaluation = await this.repository.saveResponseEvaluation(
          responseEvaluationSchema.parse({
            id: randomUUID(),
            sessionResponseId: response.id,
            overallScore: generated.overallScore,
            criterionScores: generated.criterionScores,
            summary: generated.summary,
            strengths: generated.strengths,
            improvements: generated.improvements,
            recommendation: generated.recommendation,
            schemaVersion: RESPONSE_EVALUATION_SCHEMA_VERSION,
            modelMetadata: {
              provider: 'openai',
              model: RESPONSE_EVALUATION_MODEL,
              promptVersion: RESPONSE_PROMPT_VERSION,
            },
            createdAt: new Date(),
          }),
        );
      }

      evaluatedResponses.push({ response, question, evaluation });
    }

    let sessionEvaluation = await this.repository.getSessionEvaluation(
      context.session.id,
      SESSION_EVALUATION_SCHEMA_VERSION,
    );

    if (!sessionEvaluation) {
      sessionEvaluation = await this.repository.saveSessionEvaluation(
        buildSessionEvaluation(
          context.session,
          context.practiceVersion,
          evaluatedResponses.map((item) => item.evaluation),
        ),
      );
    }

    return {
      session: context.session,
      practiceVersion: context.practiceVersion,
      sessionEvaluation,
      responses: evaluatedResponses,
    };
  }

  async getExistingReport(sessionId: string): Promise<EvaluationReport | null> {
    const sessionService = createPublicSessionService();
    const context = await sessionService.getContext(sessionId);
    if (!context || context.session.status !== 'completed') {
      return null;
    }

    const sessionEvaluation = await this.repository.getSessionEvaluation(
      sessionId,
      SESSION_EVALUATION_SCHEMA_VERSION,
    );
    if (!sessionEvaluation) {
      return null;
    }

    const responseEvaluations = await this.repository.listSessionResponseEvaluations(
      sessionId,
      RESPONSE_EVALUATION_SCHEMA_VERSION,
    );
    const evaluationsByResponseId = new Map(
      responseEvaluations.map((evaluation) => [
        evaluation.sessionResponseId,
        evaluation,
      ]),
    );

    const responses = selectLatestAttempts(context.responses)
      .map((response) => {
        const evaluation = evaluationsByResponseId.get(response.id);
        if (!evaluation) return null;
        return {
          response,
          question: findQuestion(context.practiceVersion, response),
          evaluation,
        };
      })
      .filter((item): item is EvaluatedResponse => item !== null);

    return {
      session: context.session,
      practiceVersion: context.practiceVersion,
      sessionEvaluation,
      responses,
    };
  }
}

function selectLatestAttempts(responses: SessionResponse[]): SessionResponse[] {
  const latestByQuestion = new Map<string, SessionResponse>();

  for (const response of responses) {
    const existing = latestByQuestion.get(response.questionId);
    if (!existing || response.attemptNumber > existing.attemptNumber) {
      latestByQuestion.set(response.questionId, response);
    }
  }

  return Array.from(latestByQuestion.values()).sort(
    (a, b) => a.questionOrder - b.questionOrder,
  );
}

function findQuestion(
  practiceVersion: PracticeVersion,
  response: SessionResponse,
): PracticeQuestion {
  const question = practiceVersion.snapshot.questions.find(
    (candidate) =>
      candidate.id === response.questionId &&
      candidate.order === response.questionOrder,
  );

  if (!question) {
    throw new Error(
      `Question ${response.questionId} is not part of the session's immutable practice version.`,
    );
  }

  return question;
}

function assertRuntimeRubric(practiceVersion: PracticeVersion) {
  const criteria = practiceVersion.snapshot.rubricCriteria;
  if (criteria.length === 0 || criteria.some((criterion) => !criterion.id)) {
    throw new Error('Published rubric criteria must have runtime identifiers.');
  }

  const criterionIds = new Set(criteria.map((criterion) => criterion.id!));
  for (const question of practiceVersion.snapshot.questions) {
    if (!question.id) {
      throw new Error('Published questions must have runtime identifiers.');
    }

    // Undefined is the legacy full-rubric behavior. New published versions are
    // always hydrated with explicit mappings.
    const mappedIds = question.rubricCriterionIds;
    if (mappedIds?.some((criterionId) => !criterionIds.has(criterionId))) {
      throw new Error(
        `Published question ${question.id} references an unknown rubric criterion.`,
      );
    }
  }
}

function rubricForQuestion(
  practiceVersion: PracticeVersion,
  question: PracticeQuestion,
): RubricCriterion[] {
  const rubric = practiceVersion.snapshot.rubricCriteria;
  const mappedIds = question.rubricCriterionIds;

  if (!mappedIds || mappedIds.length === 0) {
    return rubric;
  }

  const rubricById = new Map(
    rubric.map((criterion) => [criterion.id, criterion] as const),
  );
  const mapped = mappedIds.map((criterionId) => {
    const criterion = rubricById.get(criterionId);
    if (!criterion) {
      throw new Error(
        `Question ${question.id ?? question.order} references unknown rubric criterion ${criterionId}.`,
      );
    }
    return criterion;
  });

  if (mapped.length === 0) {
    throw new Error('A published question must map to at least one rubric criterion.');
  }

  return mapped.sort((a, b) => a.order - b.order);
}

function buildSessionEvaluation(
  session: Session,
  practiceVersion: PracticeVersion,
  responseEvaluations: ResponseEvaluation[],
): SessionEvaluation {
  if (responseEvaluations.length === 0) {
    throw new Error('At least one response evaluation is required to aggregate a session.');
  }

  const rubric = practiceVersion.snapshot.rubricCriteria;
  const criterionScores = rubric.flatMap((criterion) => {
    const scores = responseEvaluations
      .flatMap((evaluation) => evaluation.criterionScores)
      .filter((score) => score.criterionId === criterion.id);

    // A criterion can be mapped only to questions that the participant did not
    // answer. In that case there is no evidence to score, so omit it rather than
    // fabricating a zero.
    if (scores.length === 0) return [];

    const score = roundScore(
      scores.reduce((sum, item) => sum + item.score, 0) / scores.length,
    );

    return [
      {
        criterionId: criterion.id!,
        criterionName: criterion.name,
        score,
        feedback: `Average across ${scores.length} evaluated response${scores.length === 1 ? '' : 's'} mapped to this criterion. Published rubric weight: ${criterion.weight}%.`,
      },
    ];
  });

  if (criterionScores.length === 0) {
    throw new Error('No rubric evidence was available to aggregate this session.');
  }

  const rubricById = new Map(
    rubric.map((criterion) => [criterion.id!, criterion] as const),
  );
  const evidenceWeight = criterionScores.reduce(
    (sum, criterionScore) =>
      sum + (rubricById.get(criterionScore.criterionId)?.weight ?? 0),
    0,
  );

  if (evidenceWeight <= 0) {
    throw new Error('Rubric evidence must have a positive total weight.');
  }

  const overallScore = roundScore(
    criterionScores.reduce((sum, criterionScore) => {
      const weight = rubricById.get(criterionScore.criterionId)?.weight ?? 0;
      return sum + criterionScore.score * weight;
    }, 0) / evidenceWeight,
  );
  const strongest = criterionScores.reduce((best, current) =>
    current.score > best.score ? current : best,
  );
  const weakest = criterionScores.reduce((lowest, current) =>
    current.score < lowest.score ? current : lowest,
  );
  const strengths = uniqueStrings(
    responseEvaluations.flatMap((evaluation) => evaluation.strengths),
  ).slice(0, 5);
  const improvements = uniqueStrings(
    responseEvaluations.flatMap((evaluation) => evaluation.improvements),
  ).slice(0, 5);

  return sessionEvaluationSchema.parse({
    id: randomUUID(),
    sessionId: session.id,
    overallScore,
    criterionScores,
    summary: `Across ${responseEvaluations.length} evaluated response${responseEvaluations.length === 1 ? '' : 's'}, the rubric-weighted session score is ${Math.round(overallScore)}/100. Strongest area: ${strongest.criterionName}. Primary improvement area: ${weakest.criterionName}.`,
    strengths:
      strengths.length > 0
        ? strengths
        : [`Strongest rubric area: ${strongest.criterionName}.`],
    improvements:
      improvements.length > 0
        ? improvements
        : [`Continue developing ${weakest.criterionName}.`],
    recommendation: `Prioritize ${weakest.criterionName} next. Review the response-level feedback, then repeat a similar practice and aim to improve this criterion above ${Math.round(weakest.score)}/100.`,
    schemaVersion: SESSION_EVALUATION_SCHEMA_VERSION,
    modelMetadata: {
      provider: 'interviewgrade',
      model: 'deterministic-rubric-weighted-aggregation',
      promptVersion: SESSION_AGGREGATION_VERSION,
    },
    createdAt: new Date(),
  });
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value.trim();
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }

  return result;
}

export function createEvaluationService(): EvaluationService {
  return new EvaluationService(new DrizzleEvaluationRepository());
}
