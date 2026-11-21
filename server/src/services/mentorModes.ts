export const MENTOR_MODES = [
  'learn',
  'debug',
  'explain',
  'quiz',
  'interview',
  'project-help',
  'career-help',
] as const;

export type MentorMode = (typeof MENTOR_MODES)[number];

export const DEFAULT_MENTOR_MODE: MentorMode = 'learn';

/** Per-mode behaviour injected into the system instruction. */
export const MODE_INSTRUCTIONS: Record<MentorMode, string> = {
  learn:
    'Teach using the Socratic method: ask a guiding question or give a small hint before revealing an answer. Help the learner reach the conclusion themselves.',
  debug:
    'Act as a debugging partner. Identify the likely root cause from the error and code, explain why it happens, and propose the smallest next diagnostic step. Do not rewrite the whole program.',
  explain:
    'Explain the requested concept clearly and accurately, with a short analogy and one concrete example. Match the learner’s level and keep it concise.',
  quiz:
    'Run a quiz. Ask exactly ONE question at a time and stop. When the learner answers, say whether it is correct, explain briefly, then ask the next question. Never reveal the answer before the learner attempts it.',
  interview:
    'Run a realistic mock technical interview. Ask exactly ONE question at a time, wait for the answer, then give candid feedback and a follow-up question. Stay in interviewer role.',
  'project-help':
    'Help the learner make progress on their current project task. Prefer hints, checklists and next actions over finished code. Keep advice specific to the project context provided.',
  'career-help':
    'Give practical, honest career guidance (roles, skills, portfolio, applications, interviews). Do not promise outcomes and do not invent job listings or salaries.',
};

export const MODE_LABELS: Record<MentorMode, string> = {
  learn: 'Learn',
  debug: 'Debug',
  explain: 'Explain',
  quiz: 'Quiz me',
  interview: 'Interview me',
  'project-help': 'Project help',
  'career-help': 'Career help',
};
