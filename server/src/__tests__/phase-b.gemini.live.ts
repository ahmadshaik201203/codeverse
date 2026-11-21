/**
 * Phase B — REAL Gemini integration suite.
 *
 * This file is intentionally NOT part of `npm test`. It makes live, billable
 * provider calls and requires credentials in the process environment:
 *
 *   GEMINI_API_KEY=... npm run test:gemini
 *
 * The key is read from the environment only. It is never printed, logged or
 * written into the database. The suite uses its own `_test` database.
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Blueprint } from '../models/Blueprint';
import { resetRateLimits } from '../middleware/rateLimit';
import { env } from '../config/env';
import { MENTOR_MODES, type MentorMode } from '../services/mentorModes';

const TEST_URI = process.env.TEST_MONGODB_URI?.trim() || 'mongodb://127.0.0.1:27017/codeverse_phase_b_live_test';
const TEST_DB_NAME = new URL(TEST_URI.replace('mongodb://', 'http://')).pathname.replace(/^\//, '');

if (!TEST_DB_NAME.endsWith('_test')) {
  throw new Error(`Refusing to run: test database "${TEST_DB_NAME}" must end with "_test".`);
}
if (!process.env.GEMINI_API_KEY?.trim()) {
  throw new Error(
    'GEMINI_API_KEY is required for the real Gemini suite. Export it in the process environment before running npm run test:gemini.'
  );
}

const PASSWORD = 'PhaseB#Live2026';
const EMAIL = 'phase-b-live@codeverse.test';
const MODE_PROMPTS: Record<MentorMode, string> = {
  learn: 'Give me one hint for understanding JavaScript closures.',
  debug: 'A React effect runs twice in development. What should I check first?',
  explain: 'Explain database indexing in three sentences.',
  quiz: 'Start a quiz on JavaScript arrays with one question.',
  interview: 'Start a mock interview for a frontend internship with one question.',
  'project-help': 'I am building an e-commerce catalogue. What is the first implementation step?',
  'career-help': 'What should a second-year student focus on for a backend internship?',
};

let server: Server;
let baseUrl: string;
let token: string;
let projectId: string;

interface ApiResponse {
  status: number;
  body: Record<string, unknown>;
}

const api = async (
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {}
): Promise<ApiResponse> => {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });

  const text = await response.text();
  let body: Record<string, unknown> = {};
  if (text) {
    try {
      body = JSON.parse(text) as Record<string, unknown>;
    } catch {
      body = { raw: text };
    }
  }
  return { status: response.status, body };
};

const errorCode = (body: Record<string, unknown>): string | undefined =>
  (body.error as { code?: string } | undefined)?.code;

describe('Phase B — real Gemini integration', () => {
  before(async () => {
    console.log(`[live] model: ${env.geminiModel} · database: ${TEST_DB_NAME}`);

    await mongoose.connect(TEST_URI);
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }

    const project = await Project.create({
      title: 'AI E-commerce Platform',
      slug: 'ai-ecommerce-platform-live',
      domainSlug: 'full-stack-development',
      category: 'AI',
      difficulty: 'Intermediate',
      description:
        'Build a storefront with a product catalogue, cart and AI-powered recommendations.',
      problemStatement: 'Students need a realistic full-stack build with an API and database.',
      estimatedTime: '10 hours',
      technologies: ['Next.js', 'Express', 'MongoDB'],
      skills: ['React', 'APIs', 'Database Design'],
      tags: ['full-stack'],
    });
    projectId = String(project._id);

    server = createApp().listen(0);
    await new Promise<void>((resolve) => server.once('listening', () => resolve()));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

    const registration = await api('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Phase B Live Student',
        email: EMAIL,
        password: PASSWORD,
        college: 'Test College',
        department: 'Computer Science',
        year: '2nd Year',
      },
    });
    assert.equal(registration.status, 201, 'live test learner registration should succeed');
    token = registration.body.token as string;
    resetRateLimits();
  });

  after(async () => {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
    await mongoose.disconnect();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('generates a real, project-specific blueprint and persists it', async () => {
    const startedAt = Date.now();
    let response = await api('/api/ai/project-blueprint', {
      method: 'POST',
      token,
      body: { projectId },
    });

    // Model output shape can vary; one retry is allowed for a malformed shape.
    if (response.status === 502) {
      response = await api('/api/ai/project-blueprint', {
        method: 'POST',
        token,
        body: { projectId },
      });
    }

    console.log(`[live] blueprint: HTTP ${response.status} in ${Date.now() - startedAt}ms`);
    assert.equal(response.status, 200, `blueprint failed: ${JSON.stringify(response.body)}`);
    assert.equal(response.body.generated, true);

    const blueprint = response.body.blueprint as {
      architecture: string;
      steps: Array<{
        phase: string;
        tasks: string[];
        learningObjectives: string[];
        deliverables: string[];
      }>;
      bestPractices: string[];
    };

    assert.ok(blueprint.architecture.length >= 20);
    assert.ok(blueprint.steps.length >= 2);
    for (const step of blueprint.steps) {
      assert.ok(step.phase.length > 0);
      assert.ok(step.tasks.length > 0);
      assert.ok(step.learningObjectives.length > 0);
      assert.ok(step.deliverables.length > 0);
    }
    assert.ok(blueprint.bestPractices.length > 0);
    assert.equal(response.body.model, env.geminiModel);

    const user = await User.findOne({ email: EMAIL });
    assert.ok(user);
    const saved = await Blueprint.findOne({ userId: user._id, projectId });
    assert.ok(saved, 'blueprint must be persisted');
    console.log(
      `[live] blueprint saved: ${saved.steps.length} phases, model ${saved.providerModel}, generatedAt ${saved.generatedAt.toISOString()}`
    );

    const retrieved = await api(`/api/ai/project-blueprint/${projectId}`, { token });
    assert.equal(retrieved.status, 200);
    assert.equal(retrieved.body.saved, true);
    assert.equal(
      (retrieved.body.blueprint as { architecture: string }).architecture,
      blueprint.architecture
    );
  });

  for (const mode of MENTOR_MODES) {
    it(`answers in ${mode} mode with a real model response`, async () => {
      resetRateLimits();
      const startedAt = Date.now();
      const response = await api('/api/mentor/ask', {
        method: 'POST',
        token,
        body: {
          projectId,
          mode,
          userMessage: MODE_PROMPTS[mode],
          history: [{ role: 'user', content: 'I am a second-year engineering student.' }],
        },
      });

      console.log(
        `[live] mentor ${mode}: HTTP ${response.status} in ${Date.now() - startedAt}ms`
      );
      assert.equal(response.status, 200, `mentor ${mode} failed: ${JSON.stringify(response.body)}`);
      assert.equal(response.body.mode, mode);

      const reply = response.body.reply as string;
      assert.equal(typeof reply, 'string');
      assert.ok(reply.trim().length > 10, `mentor ${mode} returned an empty reply`);
      console.log(`[live] mentor ${mode}: reply ${reply.length} chars`);
    });
  }

  it('reviews real code and returns actionable, validated feedback', async () => {
    resetRateLimits();
    const startedAt = Date.now();
    const response = await api('/api/evaluator/review', {
      method: 'POST',
      token,
      body: {
        projectId,
        language: 'javascript',
        taskDescription: 'Render a user-supplied comment safely.',
        codeSnippet:
          "function renderComment(comment) {\n  document.getElementById('out').innerHTML = comment;\n}\n\nrenderComment(location.hash.slice(1));",
      },
    });

    console.log(`[live] evaluator: HTTP ${response.status} in ${Date.now() - startedAt}ms`);
    assert.equal(response.status, 200, `evaluator failed: ${JSON.stringify(response.body)}`);

    const review = response.body.review as {
      overallScore: number;
      verdict: string;
      summary: string;
      security: Array<{ severity: string; issue: string; recommendation: string }>;
      performance: Array<{ category: string; observation: string; suggestion: string }>;
      bestPractices: string[];
    };

    assert.ok(review.overallScore >= 0 && review.overallScore <= 100);
    assert.ok(['Passed', 'Needs Improvement', 'Failed'].includes(review.verdict));
    assert.ok(review.summary.length >= 10);
    const actionable =
      review.security.length + review.performance.length + review.bestPractices.length;
    assert.ok(actionable > 0, 'review must contain actionable feedback');
    console.log(
      `[live] evaluator: score ${review.overallScore}, verdict ${review.verdict}, ${review.security.length} security, ${review.performance.length} performance findings`
    );
  });

  it('verifies a real task submission and updates skills only when it passes', async () => {
    resetRateLimits();
    const before = await User.findOne({ email: EMAIL }).lean();
    const beforeSkills = (before?.skills ?? []) as Array<{ name: string; score: number }>;

    const response = await api('/api/mentor/verify', {
      method: 'POST',
      token,
      body: {
        projectId,
        taskDescription: 'Implement a function add(a, b) that returns the numeric sum.',
        codeSnippet: 'function add(a, b) {\n  return a + b;\n}\n\nmodule.exports = add;',
      },
    });

    assert.equal(response.status, 200, `verify failed: ${JSON.stringify(response.body)}`);
    assert.equal(typeof response.body.isPassed, 'boolean');
    assert.ok(String(response.body.feedback).trim().length >= 3);

    const afterUser = await User.findOne({ email: EMAIL }).lean();
    const afterSkills = (afterUser?.skills ?? []) as Array<{ name: string; score: number }>;
    console.log(
      `[live] verify: passed=${response.body.isPassed} · skills before=${beforeSkills.length} after=${afterSkills.length}`
    );

    if (response.body.isPassed === true) {
      const skill = afterSkills.find((entry) => entry.name === 'full-stack-development');
      assert.ok(skill, 'a passing verification must record the domain skill');
      assert.ok(skill.score > 0 && skill.score <= 100);
    } else {
      assert.deepEqual(afterSkills, beforeSkills, 'a failed verification must not change skills');
    }
  });
});
