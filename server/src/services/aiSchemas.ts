import { AppError } from '../middleware/error';

/**
 * Server-side validation for everything an AI provider returns.
 *
 * The rule is strict: if the provider's payload does not satisfy the exact
 * contract, the request fails with 502 `AI_INVALID_RESPONSE`. Nothing is
 * patched up, inferred or filled in with locally written content.
 */

const invalid = (description: string): AppError =>
  new AppError(
    502,
    'AI_INVALID_RESPONSE',
    `The AI service returned ${description}. Nothing was displayed — please try again.`
  );

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

export const stripCodeFences = (text: string): string => {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
};

/** Parses model text as a JSON object, rejecting anything else. */
export const parseJsonOutput = (text: string): Record<string, unknown> => {
  const cleaned = stripCodeFences(text);
  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Some models wrap the object in a sentence. Extract the outermost object
    // rather than accepting anything else; the schema still validates it.
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end <= start) throw invalid('unreadable JSON');
    try {
      parsed = JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      throw invalid('unreadable JSON');
    }
  }

  if (!isRecord(parsed)) throw invalid('unexpected JSON');
  return parsed;
};

const cleanString = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const stringList = (
  value: unknown,
  options: { field: string; minItems: number; maxItems: number; maxLength: number }
): string[] => {
  if (!Array.isArray(value)) throw invalid(`an incomplete ${options.field} list`);
  if (value.length < options.minItems || value.length > options.maxItems) {
    throw invalid(`an incomplete ${options.field} list`);
  }

  return value.map((item) => {
    if (typeof item !== 'string') throw invalid(`a malformed ${options.field} entry`);
    const cleaned = item.trim();
    if (cleaned.length < 2) throw invalid(`an empty ${options.field} entry`);
    return cleaned.slice(0, options.maxLength);
  });
};

/* ------------------------------- Blueprint ------------------------------- */

export interface BlueprintPhase {
  phase: string;
  tasks: string[];
  learningObjectives: string[];
  deliverables: string[];
}

export interface Blueprint {
  architecture: string;
  steps: BlueprintPhase[];
  bestPractices: string[];
}

export const parseBlueprint = (value: unknown): Blueprint => {
  if (!isRecord(value)) throw invalid('an unreadable blueprint');

  const architecture = cleanString(value.architecture, 4000);
  if (architecture.length < 20) throw invalid('an incomplete architecture description');

  if (!Array.isArray(value.steps)) throw invalid('an incomplete phase list');
  if (value.steps.length < 2 || value.steps.length > 10) {
    throw invalid('an incomplete phase list');
  }

  const steps = value.steps.map((entry): BlueprintPhase => {
    if (!isRecord(entry)) throw invalid('a malformed phase');

    const phase = cleanString(entry.phase, 160);
    if (phase.length < 2) throw invalid('a phase without a name');

    return {
      phase,
      tasks: stringList(entry.tasks, {
        field: 'task',
        minItems: 1,
        maxItems: 15,
        maxLength: 400,
      }),
      learningObjectives: stringList(entry.learningObjectives, {
        field: 'learning objective',
        minItems: 1,
        maxItems: 10,
        maxLength: 300,
      }),
      deliverables: stringList(entry.deliverables, {
        field: 'deliverable',
        minItems: 1,
        maxItems: 10,
        maxLength: 300,
      }),
    };
  });

  const bestPractices = stringList(value.bestPractices, {
    field: 'best practice',
    minItems: 1,
    maxItems: 10,
    maxLength: 400,
  });

  return { architecture, steps, bestPractices };
};

/* -------------------------------- Mentor --------------------------------- */

export const parseMentorReply = (value: unknown): string => {
  const reply = typeof value === 'string' ? value.trim() : '';
  if (reply.length === 0) {
    throw new AppError(
      502,
      'AI_EMPTY_RESPONSE',
      'The AI mentor returned an empty answer. Nothing was displayed — please try again.'
    );
  }
  return reply.slice(0, 12_000);
};

export interface TaskEvaluation {
  isPassed: boolean;
  feedback: string;
}

export const parseTaskEvaluation = (value: unknown): TaskEvaluation => {
  if (!isRecord(value)) throw invalid('an unreadable verification result');
  if (typeof value.isPassed !== 'boolean') throw invalid('a verification result without a verdict');

  const feedback = cleanString(value.feedback, 600);
  if (feedback.length < 3) throw invalid('a verification result without feedback');

  return { isPassed: value.isPassed, feedback };
};

/* ------------------------------ Code review ------------------------------ */

export type ReviewVerdict = 'Passed' | 'Needs Improvement' | 'Failed';
export type ReviewSeverity = 'High' | 'Medium' | 'Low';
export type ReviewCategory = 'Render' | 'Memory' | 'Network' | 'Execution';

export interface SecurityFinding {
  severity: ReviewSeverity;
  issue: string;
  recommendation: string;
}

export interface PerformanceObservation {
  category: ReviewCategory;
  observation: string;
  suggestion: string;
}

export interface CodeReview {
  overallScore: number;
  verdict: ReviewVerdict;
  summary: string;
  security: SecurityFinding[];
  performance: PerformanceObservation[];
  bestPractices: string[];
}

export const REVIEW_VERDICTS: readonly ReviewVerdict[] = ['Passed', 'Needs Improvement', 'Failed'];
const SEVERITIES: readonly ReviewSeverity[] = ['High', 'Medium', 'Low'];
const CATEGORIES: readonly ReviewCategory[] = ['Render', 'Memory', 'Network', 'Execution'];

const oneOf = <T extends string>(value: unknown, allowed: readonly T[]): T | undefined =>
  typeof value === 'string' ? allowed.find((candidate) => candidate === value) : undefined;

export const parseCodeReview = (value: unknown): CodeReview => {
  if (!isRecord(value)) throw invalid('an unreadable code review');

  const overallScore = value.overallScore;
  if (
    typeof overallScore !== 'number' ||
    !Number.isFinite(overallScore) ||
    overallScore < 0 ||
    overallScore > 100
  ) {
    throw invalid('a review without a valid score');
  }

  const verdict = oneOf(value.verdict, REVIEW_VERDICTS);
  if (!verdict) throw invalid('a review without a valid verdict');

  const summary = cleanString(value.summary, 1200);
  if (summary.length < 10) throw invalid('a review without a summary');

  const security: SecurityFinding[] = Array.isArray(value.security)
    ? value.security.slice(0, 10).map((entry): SecurityFinding => {
        if (!isRecord(entry)) throw invalid('a malformed security finding');
        const severity = oneOf(entry.severity, SEVERITIES);
        const issue = cleanString(entry.issue, 400);
        const recommendation = cleanString(entry.recommendation, 600);
        if (!severity || issue.length < 2 || recommendation.length < 2) {
          throw invalid('a malformed security finding');
        }
        return { severity, issue, recommendation };
      })
    : [];
  if (!Array.isArray(value.security)) throw invalid('an incomplete security section');

  const performance: PerformanceObservation[] = Array.isArray(value.performance)
    ? value.performance.slice(0, 10).map((entry): PerformanceObservation => {
        if (!isRecord(entry)) throw invalid('a malformed performance observation');
        const category = oneOf(entry.category, CATEGORIES);
        const observation = cleanString(entry.observation, 400);
        const suggestion = cleanString(entry.suggestion, 600);
        if (!category || observation.length < 2 || suggestion.length < 2) {
          throw invalid('a malformed performance observation');
        }
        return { category, observation, suggestion };
      })
    : [];
  if (!Array.isArray(value.performance)) throw invalid('an incomplete performance section');

  if (!Array.isArray(value.bestPractices)) throw invalid('an incomplete best-practice list');
  const bestPractices = value.bestPractices.slice(0, 8).map((item) => {
    if (typeof item !== 'string' || item.trim().length < 2) {
      throw invalid('a malformed best-practice entry');
    }
    return item.trim().slice(0, 400);
  });

  if (security.length === 0 && performance.length === 0 && bestPractices.length === 0) {
    throw invalid('a review with no actionable feedback');
  }

  return {
    overallScore: Math.round(overallScore),
    verdict,
    summary,
    security,
    performance,
    bestPractices,
  };
};
