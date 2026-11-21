'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Database,
  Layers,
  RotateCcw,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { cn } from '@/lib/cn';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ------------------------------------------------------------------ data */

const DOMAINS = [
  {
    id: 'fullstack',
    name: 'Full Stack Development',
    blurb: 'Web applications end to end',
    next: 'Commerce dashboard track · React + Node.js · 6 milestones',
    stack: ['React', 'Node.js', 'PostgreSQL'],
    Icon: Layers,
  },
  {
    id: 'aiml',
    name: 'AI/ML',
    blurb: 'Models, data and evaluation',
    next: 'Recommender engine track · Python + scikit-learn · 6 milestones',
    stack: ['Python', 'scikit-learn', 'Pandas'],
    Icon: Cpu,
  },
  {
    id: 'data',
    name: 'Data Science',
    blurb: 'Pipelines and analysis',
    next: 'Analytics pipeline track · SQL + dbt · 6 milestones',
    stack: ['SQL', 'dbt', 'Airflow'],
    Icon: Database,
  },
] as const;

const QUESTIONS = [
  {
    id: 'q1',
    text: 'A useEffect hook keeps reading a stale value. What is the most common cause?',
    options: ['The effect dependency array is missing the value', 'The component rendered too slowly', 'The browser cached the old render'],
    answer: 0,
  },
  {
    id: 'q2',
    text: 'You debounce a search input. What does that mainly buy you?',
    options: ['Better colours on the input', 'Fewer network requests while typing', 'Infinite scroll'],
    answer: 1,
  },
];

const BLUEPRINT_STEPS = ['Architecture', 'Technology stack', 'Folder structure', 'API endpoints', 'Database design'];

const MILESTONES = [
  { title: 'Foundations', tasks: ['Set up the repo and environments', 'Model the core entities', 'Add a health-check route'] },
  { title: 'System design', tasks: ['Draw the data model (ERD)', 'Define API contracts', 'Plan auth flow'] },
  { title: 'Async & errors', tasks: ['Add loading + error states', 'Handle empty results', 'Add retry logic'] },
  { title: 'APIs & auth', tasks: ['Protect the routes', 'Validate inputs', 'Write endpoint tests'] },
  { title: 'Testing', tasks: ['Cover the critical paths', 'Add CI checks', 'Fix failing tests'] },
  { title: 'Interview', tasks: ['Record a walkthrough', 'Prepare trade-off notes', 'Run a mock interview'] },
];

const INTERVIEW = [
  {
    q: 'Why did you choose Postgres over a document store here?',
    a: 'The projects and milestones are relational, need joins, and benefit from strict schema — so Postgres fits better than a schemaless store.',
  },
  {
    q: 'How would you handle a 10× traffic spike on the mentor endpoint?',
    a: 'Cache repeated answers, rate-limit per user, and move long generations to a background queue so the API stays responsive.',
  },
];

type DemoState = {
  domain: string | null;
  answers: Record<string, number>;
  assessed: boolean;
  blueprintDone: boolean;
  genStep: number;
  tasks: Record<string, boolean>;
  milestone: number;
  build: { explained: boolean; traced: boolean; fixed: boolean; verified: boolean };
  revealed: Record<string, boolean>;
};

const INITIAL_STATE: DemoState = {
  domain: null,
  answers: {},
  assessed: false,
  blueprintDone: false,
  genStep: 0,
  tasks: {},
  milestone: 0,
  build: { explained: false, traced: false, fixed: false, verified: false },
  revealed: {},
};

/* ---------------------------------------------------------------- stages */

function GoalStage({ state, patch }: { state: DemoState; patch: (p: Partial<DemoState>) => void }) {
  const selected = DOMAINS.find((d) => d.id === state.domain);
  return (
    <div>
      <h3 className="font-serif text-[20px] leading-tight tracking-[-0.015em] text-ink">Choose your career goal</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
        Every CodeVerse journey starts with a target domain. Pick one to see what the blueprint track looks like.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Target domain">
        {DOMAINS.map((d) => (
          <button
            key={d.id}
            type="button"
            role="radio"
            aria-checked={state.domain === d.id}
            onClick={() => patch({ domain: d.id })}
            className={cn(
              'rounded-card border p-4 text-left transition-[border-color,background-color,box-shadow] duration-200',
              state.domain === d.id
                ? 'border-forest/50 bg-forest/[0.07] shadow-card'
                : 'border-ink/12 bg-ivory-warm/60 hover:border-ink/25',
            )}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-forest/25 bg-ivory-warm text-forest">
              <d.Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="mt-3 block text-[14px] font-medium text-ink">{d.name}</span>
            <span className="mt-1 block text-[12px] text-ink-muted">{d.blurb}</span>
            <span
              className={cn(
                'mt-3 inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em]',
                state.domain === d.id ? 'text-forest' : 'text-ink-faint',
              )}
            >
              {state.domain === d.id ? <Check className="h-3 w-3" aria-hidden="true" /> : null}
              {state.domain === d.id ? 'Selected' : 'Select domain'}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-card border border-ink/10 bg-ivory-warm/60 px-4 py-3.5" aria-live="polite">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-faint">What happens next</p>
        <p className="mt-1.5 text-[13px] text-ink-soft">
          {selected ? selected.next : 'Select a domain to preview the blueprint track for it.'}
        </p>
      </div>
    </div>
  );
}

function AssessmentStage({ state, patch }: { state: DemoState; patch: (p: Partial<DemoState>) => void }) {
  const answered = QUESTIONS.every((q) => state.answers[q.id] !== undefined);
  const correct = QUESTIONS.filter((q) => state.answers[q.id] === q.answer).length;

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-[20px] leading-tight tracking-[-0.015em] text-ink">Assess your skills</h3>
          <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-ink-muted">
            Two sample questions stand in for the full diagnostic. Answer both to see how results are presented.
          </p>
        </div>
        <Badge tone="outline">Demo mode</Badge>
      </div>

      <div className="mt-5 space-y-4">
        {QUESTIONS.map((q, qi) => (
          <fieldset key={q.id} className="rounded-card border border-ink/10 bg-ivory-warm/60 p-4">
            <legend className="sr-only">{q.text}</legend>
            <p className="text-[13px] font-medium text-ink">
              <span className="font-mono text-[10px] text-ink-faint">Q{qi + 1} · </span>
              {q.text}
            </p>
            <div className="mt-3 space-y-2">
              {q.options.map((option, oi) => (
                <label
                  key={option}
                  className={cn(
                    'flex cursor-pointer items-start gap-2.5 rounded-[10px] border px-3 py-2.5 text-[12.5px] transition-colors',
                    state.answers[q.id] === oi
                      ? 'border-forest/45 bg-forest/[0.06] text-ink'
                      : 'border-ink/10 text-ink-muted hover:border-ink/25',
                  )}
                >
                  <input
                    type="radio"
                    name={q.id}
                    checked={state.answers[q.id] === oi}
                    onChange={() => patch({ answers: { ...state.answers, [q.id]: oi }, assessed: false })}
                    className="mt-0.5 accent-[#536B58]"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-4">
        {!state.assessed ? (
          <button
            type="button"
            disabled={!answered}
            onClick={() => patch({ assessed: true })}
            className="inline-flex h-10 items-center gap-2 rounded-control bg-forest px-4 text-[13px] font-medium text-ivory-warm transition-colors hover:bg-forest-deep disabled:opacity-45"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            See my results
          </button>
        ) : (
          <div className="space-y-3" aria-live="polite">
            <p className="text-[13px] text-ink-soft">
              You answered <span className="font-medium text-ink">{correct} of {QUESTIONS.length}</span> correctly.
              In the full diagnostic, CodeVerse maps this to a skill profile like the sample below.
            </p>
            {[
              { label: 'React hooks', value: 55, note: 'gap' },
              { label: 'API design', value: 80, note: 'strength' },
              { label: 'Testing strategy', value: 45, note: 'gap' },
              { label: 'Problem decomposition', value: 90, note: 'strength' },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-ink-soft">{row.label}</span>
                  <span className={cn('font-mono text-[10px] uppercase tracking-[0.1em]', row.note === 'strength' ? 'text-forest' : 'text-ink-faint')}>
                    {row.note}
                  </span>
                </div>
                <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-ink/10">
                  <motion.div
                    className={cn('h-full rounded-full', row.note === 'strength' ? 'bg-forest' : 'bg-sage')}
                    initial={{ width: '0%' }}
                    animate={{ width: `${row.value}%` }}
                    transition={{ duration: 0.8, ease: EASE }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BlueprintPanel({ domain }: { domain: (typeof DOMAINS)[number] | undefined }) {
  return (
    <div className="mt-5 grid gap-3 lg:grid-cols-2">
      <div className="rounded-card border border-ink/10 bg-ivory-warm/60 p-4">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-faint">Architecture</p>
        <div className="mt-3 flex items-center gap-2" aria-hidden="true">
          {['Client', 'API', 'Database'].map((node, i) => (
            <React.Fragment key={node}>
              <span className="rounded-[8px] border border-ink/10 bg-ivory-warm px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink">
                {node}
              </span>
              {i < 2 ? <span className="h-px flex-1 bg-forest/35" /> : null}
            </React.Fragment>
          ))}
        </div>
        <p className="mt-4 font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-faint">Technology stack</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(domain?.stack || ['React', 'Node.js']).map((tech) => (
            <span key={tech} className="rounded-full border border-forest/25 bg-forest/[0.06] px-2.5 py-1 text-[11px] text-forest-deep">
              {tech}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <pre className="overflow-x-auto rounded-card border border-ink/10 bg-white/60 p-3.5 font-mono text-[11px] leading-[1.7] text-ink-soft">
          {`src/
  components/
  app/api/        # routes
  lib/db/         # schema
  lib/mentor/     # AI prompts`}
        </pre>
        <div className="rounded-card border border-ink/10 bg-ivory-warm/60 p-3.5 font-mono text-[10.5px] leading-[1.8] text-ink-muted">
          <p><span className="text-forest">GET</span> /api/projects/:id</p>
          <p><span className="text-forest">POST</span> /api/mentor/ask</p>
          <p><span className="text-forest">POST</span> /api/mentor/verify</p>
          <p className="mt-1 text-ink-faint">tables: users · projects · milestones</p>
        </div>
      </div>
    </div>
  );
}

function BlueprintStage({ state, patch }: { state: DemoState; patch: (p: Partial<DemoState>) => void }) {
  const domain = DOMAINS.find((d) => d.id === state.domain);

  useEffect(() => {
    if (!state.blueprintDone && state.genStep < BLUEPRINT_STEPS.length) {
      const timer = window.setTimeout(() => patch({ genStep: state.genStep + 1 }), 600);
      return () => window.clearTimeout(timer);
    }
    if (state.genStep >= BLUEPRINT_STEPS.length && !state.blueprintDone) {
      patch({ blueprintDone: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.genStep, state.blueprintDone]);

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-[20px] leading-tight tracking-[-0.015em] text-ink">Generate your AI blueprint</h3>
          <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-ink-muted">
            {domain ? `For ${domain.name} — watch the generator assemble the plan, step by step.` : 'Watch the generator assemble the plan, step by step.'}
          </p>
        </div>
        <Badge tone="outline">Demo mode</Badge>
      </div>

      <ul className="mt-5 space-y-2" aria-live="polite">
        {BLUEPRINT_STEPS.map((step, i) => {
          const done = i < state.genStep;
          const active = i === state.genStep && !state.blueprintDone;
          return (
            <li
              key={step}
              className={cn(
                'flex items-center gap-3 rounded-[10px] border px-3.5 py-2.5 text-[13px] transition-colors',
                done ? 'border-forest/25 bg-forest/[0.05] text-ink' : active ? 'border-ink/20 bg-ivory-warm text-ink' : 'border-ink/10 text-ink-faint',
              )}
            >
              <span className={cn('flex h-5 w-5 items-center justify-center rounded-full border', done ? 'border-forest bg-forest text-ivory-warm' : 'border-ink/20')}>
                {done ? <Check className="h-3 w-3" aria-hidden="true" /> : active ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-forest" /> : null}
              </span>
              {step}
            </li>
          );
        })}
      </ul>

      {state.blueprintDone ? (
        <BlueprintPanel domain={domain} />
      ) : (
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
          Generating sample blueprint — no AI service is called in demo mode.
        </p>
      )}
    </div>
  );
}

function RoadmapStage({ state, patch }: { state: DemoState; patch: (p: Partial<DemoState>) => void }) {
  const total = MILESTONES.reduce((sum, m) => sum + m.tasks.length, 0);
  const done = Object.values(state.tasks).filter(Boolean).length;
  const milestone = MILESTONES[state.milestone];

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-[20px] leading-tight tracking-[-0.015em] text-ink">Follow your roadmap</h3>
          <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-ink-muted">
            Six manageable milestones. Open one, tick off its tasks, and watch progress move.
          </p>
        </div>
        <div className="text-right">
          <p className="font-serif text-[20px] leading-none text-forest">{Math.round((done / total) * 100)}%</p>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-faint">complete</p>
        </div>
      </div>

      <div className="mt-3 h-[5px] overflow-hidden rounded-full bg-ink/10">
        <motion.div className="h-full rounded-full bg-forest" animate={{ width: `${(done / total) * 100}%` }} transition={{ duration: 0.5, ease: EASE }} />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-1.5" role="tablist" aria-label="Roadmap milestones">
          {MILESTONES.map((m, i) => {
            const finished = m.tasks.every((t) => state.tasks[`${i}-${t}`]);
            return (
              <button
                key={m.title}
                type="button"
                role="tab"
                aria-selected={i === state.milestone}
                aria-label={`Milestone ${i + 1}: ${m.title}`}
                onClick={() => patch({ milestone: i })}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border font-mono text-[11px] transition-colors',
                  i === state.milestone
                    ? 'border-forest bg-forest text-ivory-warm'
                    : finished
                      ? 'border-forest/40 text-forest'
                      : 'border-ink/15 text-ink-faint hover:border-ink/30',
                )}
              >
                {finished ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Previous milestone"
            disabled={state.milestone === 0}
            onClick={() => patch({ milestone: state.milestone - 1 })}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-forest/40 hover:text-forest disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next milestone"
            disabled={state.milestone === MILESTONES.length - 1}
            onClick={() => patch({ milestone: state.milestone + 1 })}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-forest/40 hover:text-forest disabled:opacity-40"
          >
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <fieldset className="mt-4 rounded-card border border-ink/10 bg-ivory-warm/60 p-4">
        <legend className="sr-only">{`Milestone ${state.milestone + 1}: ${milestone.title}`}</legend>
        <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-faint">
          Milestone {state.milestone + 1} of {MILESTONES.length}
        </p>
        <p className="mt-1 font-serif text-[16px] text-ink">{milestone.title}</p>
        <div className="mt-3 space-y-2">
          {milestone.tasks.map((task) => {
            const key = `${state.milestone}-${task}`;
            const checked = !!state.tasks[key];
            return (
              <label
                key={task}
                className={cn(
                  'flex cursor-pointer items-start gap-2.5 rounded-[10px] border px-3 py-2.5 text-[12.5px] transition-colors',
                  checked ? 'border-forest/30 bg-forest/[0.05] text-ink-faint' : 'border-ink/10 text-ink hover:border-ink/25',
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => patch({ tasks: { ...state.tasks, [key]: !checked } })}
                  className="mt-0.5 accent-[#536B58]"
                />
                <span className={checked ? 'line-through' : undefined}>{task}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

function BuildStage({ state, patch }: { state: DemoState; patch: (p: Partial<DemoState>) => void }) {
  const b = state.build;
  const doneCount = [b.explained, b.traced, b.fixed, b.verified].filter(Boolean).length;

  return (
    <div>
      <h3 className="font-serif text-[20px] leading-tight tracking-[-0.015em] text-ink">Build with AI assistance</h3>
      <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-ink-muted">
        A realistic debugging loop: ask for an explanation, run the code, let the mentor fix the bug, then verify.
      </p>

      <pre className="mt-4 overflow-x-auto rounded-card border border-ink/10 bg-white/60 p-3.5 font-mono text-[11px] leading-[1.7] text-ink-soft">
        {`// build.js — assemble the blueprint project
const result = await AI.built({
  modules: ["auth", "billing"],
  database: "postgres",
});
console.log(result.summary);`}
      </pre>

      <div className="mt-3 space-y-2">
        {[
          { key: 'explained' as const, label: 'Explain this code', done: b.explained },
          { key: 'traced' as const, label: 'Run it', done: b.traced },
          { key: 'fixed' as const, label: 'Fix with AI mentor', done: b.fixed },
          { key: 'verified' as const, label: 'Verify the fix', done: b.verified },
        ].map((action) => (
          <div key={action.key} className="flex items-center gap-3">
            <button
              type="button"
              disabled={action.done}
              onClick={() => patch({ build: { ...state.build, [action.key]: true } })}
              className={cn(
                'inline-flex h-9 items-center gap-2 rounded-control border px-3 text-[12px] font-medium transition-colors disabled:opacity-50',
                action.done
                  ? 'border-forest/30 bg-forest/[0.06] text-forest-deep'
                  : 'border-ink/20 text-ink hover:border-forest/40 hover:text-forest',
              )}
            >
              {action.done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
              {action.label}
            </button>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-faint">
              {action.done ? 'done' : 'pending'}
            </span>
          </div>
        ))}
      </div>

      {b.traced && !b.fixed ? (
        <div className="mt-3 rounded-[10px] border border-[var(--color-danger)]/25 bg-[var(--color-danger-tint)] px-3.5 py-3 font-mono text-[11px] leading-[1.7] text-[var(--color-danger)]" role="alert">
          <Terminal className="mr-2 inline h-3.5 w-3.5" aria-hidden="true" />
          TypeError: AI.built is not a function
        </div>
      ) : null}

      {b.fixed ? (
        <div className="mt-3 rounded-[10px] border border-ink/10 bg-white/60 px-3.5 py-3 font-mono text-[11px] leading-[1.7]" aria-live="polite">
          <p className="text-[var(--color-danger)] line-through opacity-70">AI.built(&#123;…&#125;)</p>
          <p className="text-forest-deep">AI.build(&#123;…&#125;) <span className="text-ink-faint">{'// mentor suggestion'}</span></p>
          {b.verified ? (
            <p className="mt-1 text-forest-deep">
              <Check className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
              verified: 2 modules · postgres · ready
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4">
        <div className="flex items-center justify-between font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-faint">
          <span>Project progress</span>
          <span className="text-forest">{doneCount * 25}%</span>
        </div>
        <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-ink/10">
          <motion.div className="h-full rounded-full bg-forest" animate={{ width: `${doneCount * 25}%` }} transition={{ duration: 0.5, ease: EASE }} />
        </div>
      </div>
    </div>
  );
}

function ReadinessStage({ state, patch, onFinish }: { state: DemoState; patch: (p: Partial<DemoState>) => void; onFinish: () => void }) {
  const scores = [
    { label: 'Code quality', value: 91 },
    { label: 'Tests & integrity', value: 84 },
    { label: 'Interview readiness', value: 78 },
  ];

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-[20px] leading-tight tracking-[-0.015em] text-ink">Become job ready</h3>
          <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-ink-muted">
            AI code review and mock interviews turn finished work into evidence for employers.
          </p>
        </div>
        <Badge tone="outline">Demo mode</Badge>
      </div>

      <div className="mt-5 space-y-3">
        {scores.map((score) => (
          <div key={score.label}>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-ink-soft">{score.label}</span>
              <span className="font-mono text-[11px] text-forest">{score.value}%</span>
            </div>
            <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-ink/10">
              <motion.div
                className="h-full rounded-full bg-forest"
                initial={{ width: '0%' }}
                animate={{ width: `${score.value}%` }}
                transition={{ duration: 0.8, ease: EASE }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-faint">Mock interview · sample round</p>
        {INTERVIEW.map((item, i) => {
          const key = String(i);
          const open = !!state.revealed[key];
          return (
            <div key={key} className="rounded-card border border-ink/10 bg-ivory-warm/60 p-4">
              <p className="text-[13px] font-medium text-ink">
                <span className="font-mono text-[10px] text-ink-faint">Q{i + 1} · </span>
                {item.q}
              </p>
              <button
                type="button"
                onClick={() => patch({ revealed: { ...state.revealed, [key]: !open } })}
                aria-expanded={open}
                className="mt-2 text-[12px] font-medium text-forest underline-offset-4 hover:underline"
              >
                {open ? 'Hide sample answer' : 'Reveal sample answer'}
              </button>
              {open ? (
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted" aria-live="polite">
                  {item.a}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col items-start gap-2 rounded-card border border-forest/25 bg-forest/[0.05] px-4 py-4">
        <p className="text-[13px] text-ink-soft">
          Overall readiness <span className="font-serif text-[18px] text-forest">86%</span> — this is where
          the demo ends and your real journey begins.
        </p>
        <Link
          href="/register"
          onClick={onFinish}
          className="inline-flex h-10 items-center gap-2 rounded-control bg-forest px-4 text-[13px] font-medium text-ivory-warm transition-colors hover:bg-forest-deep"
        >
          Start Your Journey
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- modal */

type WatchDemoProps = {
  open: boolean;
  onClose: () => void;
};

const STAGE_NAMES = [
  'Choose career goal',
  'Skill assessment',
  'Generate AI blueprint',
  'Learning roadmap',
  'Build project',
  'Job readiness',
] as const;

export default function WatchDemo({ open, onClose }: WatchDemoProps) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<DemoState>(INITIAL_STATE);
  const [direction, setDirection] = useState(1);
  const reducedMotion = useReducedMotion() ?? false;
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocused = useRef<Element | null>(null);

  const patch = useCallback((p: Partial<DemoState>) => {
    setState((s) => ({ ...s, ...p }));
  }, []);

  const go = useCallback(
    (next: number) => {
      const clamped = Math.min(5, Math.max(0, next));
      setDirection(clamped >= step ? 1 : -1);
      setStep(clamped);
    },
    [step],
  );

  const restart = useCallback(() => {
    setState(INITIAL_STATE);
    setDirection(-1);
    setStep(0);
  }, []);

  useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowRight') go(step + 1);
      else if (event.key === 'ArrowLeft') go(step - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
      if (lastFocused.current instanceof HTMLElement) lastFocused.current.focus();
    };
  }, [open, onClose, step, go]);

  if (!open) return null;

  const canNext = step === 0 ? state.domain !== null : true;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="watch-demo-title"
        className="surface-strong relative flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-panel"
      >
        <div className="flex items-center justify-between border-b border-ink/10 bg-ivory-warm/60 px-5 py-4">
          <div>
            <h2 id="watch-demo-title" className="font-serif text-[19px] leading-tight tracking-[-0.015em] text-ink">
              CodeVerse guided tour
            </h2>
            <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-faint">
              Step {String(step + 1).padStart(2, '0')} / 06 · {STAGE_NAMES[step]} · demo mode
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="sage">Demo mode</Badge>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close guided tour"
              className="rounded-[7px] p-2 text-ink-faint transition-colors hover:bg-ink/[0.06] hover:text-ink"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="h-[3px] bg-ink/10" aria-hidden="true">
          <motion.div
            className="h-full origin-left bg-forest"
            animate={{ scaleX: (step + 1) / STAGE_NAMES.length }}
            transition={{ duration: reducedMotion ? 0 : 0.4, ease: EASE }}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <AnimatePresence initial={false} mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: reducedMotion ? 0 : direction * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reducedMotion ? 0 : direction * -24 }}
              transition={{ duration: reducedMotion ? 0 : 0.4, ease: EASE }}
            >
              {step === 0 ? <GoalStage state={state} patch={patch} /> : null}
              {step === 1 ? <AssessmentStage state={state} patch={patch} /> : null}
              {step === 2 ? <BlueprintStage state={state} patch={patch} /> : null}
              {step === 3 ? <RoadmapStage state={state} patch={patch} /> : null}
              {step === 4 ? <BuildStage state={state} patch={patch} /> : null}
              {step === 5 ? <ReadinessStage state={state} patch={patch} onFinish={onClose} /> : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 bg-ivory-warm/60 px-5 py-3.5">
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Tour stages">
            {STAGE_NAMES.map((name, i) => (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={i === step}
                aria-label={`Go to stage ${i + 1}: ${name}`}
                onClick={() => go(i)}
                className={cn(
                  'h-[6px] rounded-full transition-[width,background-color] duration-300 ease-out',
                  i === step ? 'w-[22px] bg-forest' : 'w-[6px] bg-ink/20 hover:bg-ink/35',
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={restart}
              aria-label="Start the tour again"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-ink/15 px-2.5 text-[11px] font-medium text-ink transition-colors hover:border-forest/40 hover:text-forest"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              Start again
            </button>
            <button
              type="button"
              aria-label="Previous stage"
              disabled={step === 0}
              onClick={() => go(step - 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-forest/40 hover:text-forest disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Next stage"
              disabled={step === 5 || !canNext}
              onClick={() => go(step + 1)}
              className="inline-flex h-8 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-forest/40 hover:text-forest disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
