/**
 * Phase A API tests.
 *
 * Runs against the real Express app and an *isolated* database whose name must
 * end in `_test`; it is dropped between tests. The development database
 * (`codeverse`) is never referenced or written.
 *
 * Command: npm test (from `server/`)
 */
import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { User } from '../models/User';
import { resetRateLimits } from '../middleware/rateLimit';
import {
  recordVerifiedSkill,
  MAX_SKILL_SCORE,
  VERIFIED_TASK_SKILL_POINTS,
} from '../services/skillService';

const DEFAULT_TEST_URI = 'mongodb://127.0.0.1:27017/codeverse_phase_a_test';
const TEST_URI = process.env.TEST_MONGODB_URI?.trim() || DEFAULT_TEST_URI;
const TEST_DB_NAME = new URL(TEST_URI.replace('mongodb://', 'http://')).pathname.replace(/^\//, '');

if (!TEST_DB_NAME.endsWith('_test')) {
  throw new Error(
    `Refusing to run: test database "${TEST_DB_NAME}" must end with "_test". Set TEST_MONGODB_URI to an isolated database.`
  );
}

const PASSWORD = 'PhaseA#Strong2026';
const BLUEPRINT_PROJECT_ID = '64b7f0c2f1a2b3c4d5e6f7a8';

let server: Server;
let baseUrl: string;

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

const registerStudent = async (email = 'phase-a@codeverse.test') =>
  api('/api/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Phase A Student',
      email,
      password: PASSWORD,
      college: 'Test College',
      department: 'Computer Science',
      year: '2nd Year',
    },
  });

const loginStudent = async (email = 'phase-a@codeverse.test') => {
  const response = await api('/api/auth/login', {
    method: 'POST',
    body: { email, password: PASSWORD },
  });
  assert.equal(response.status, 200, 'login should succeed for a registered student');
  return response.body.token as string;
};

describe('Phase A API', () => {
  before(async () => {
    // Tests must exercise the "provider not configured" path deterministically.
    delete process.env.GEMINI_API_KEY;

    await mongoose.connect(TEST_URI);
    console.log(`[tests] isolated database: ${TEST_DB_NAME}`);

    server = createApp().listen(0);
    await new Promise<void>((resolve) => server.once('listening', () => resolve()));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  after(async () => {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
    await mongoose.disconnect();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  beforeEach(async () => {
    resetRateLimits();
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
  });

  describe('authentication', () => {
    it('registers a student and returns a usable session token', async () => {
      const response = await registerStudent();

      assert.equal(response.status, 201);
      assert.equal(typeof response.body.token, 'string');
      assert.equal((response.body.user as { email: string }).email, 'phase-a@codeverse.test');
      assert.equal((response.body.user as { password?: string }).password, undefined);
    });

    it('rejects a duplicate email with 409', async () => {
      await registerStudent();
      const duplicate = await registerStudent();

      assert.equal(duplicate.status, 409);
      assert.equal(errorCode(duplicate.body), 'EMAIL_IN_USE');
    });

    it('rejects a weak password with 422 before creating an account', async () => {
      const weak = await api('/api/auth/register', {
        method: 'POST',
        body: {
          fullName: 'Weak Password',
          email: 'weak@codeverse.test',
          password: '123456789012',
          college: 'Test College',
          department: 'CS',
          year: '1st Year',
        },
      });

      assert.equal(weak.status, 422);
      assert.equal(errorCode(weak.body), 'WEAK_PASSWORD');
      assert.equal(await User.countDocuments({ email: 'weak@codeverse.test' }), 0);
    });

    it('answers the same 401 for a wrong password and an unknown email', async () => {
      await registerStudent();

      const wrongPassword = await api('/api/auth/login', {
        method: 'POST',
        body: { email: 'phase-a@codeverse.test', password: 'WrongPassword#2026' },
      });
      const unknownEmail = await api('/api/auth/login', {
        method: 'POST',
        body: { email: 'nobody@codeverse.test', password: PASSWORD },
      });

      assert.equal(wrongPassword.status, 401);
      assert.equal(unknownEmail.status, 401);
      assert.equal(errorCode(wrongPassword.body), 'INVALID_CREDENTIALS');
      assert.equal(
        (wrongPassword.body.error as { message: string }).message,
        (unknownEmail.body.error as { message: string }).message
      );
    });

    it('rejects an unauthenticated /auth/me request with 401', async () => {
      const response = await api('/api/auth/me');
      assert.equal(response.status, 401);
      assert.equal(errorCode(response.body), 'UNAUTHORIZED');
    });

    it('returns the signed-in user for /auth/me', async () => {
      await registerStudent();
      const token = await loginStudent();
      const response = await api('/api/auth/me', { token });

      assert.equal(response.status, 200);
      const user = (response.body.user ?? response.body) as { email?: string };
      assert.equal(user.email, 'phase-a@codeverse.test');
    });

    it('rejects an empty login body with a 422 validation error', async () => {
      const response = await api('/api/auth/login', { method: 'POST', body: {} });

      assert.equal(response.status, 422);
      assert.equal(errorCode(response.body), 'VALIDATION_ERROR');
    });
  });

  describe('student role restrictions', () => {
    it('forbids a student from reading the admin overview', async () => {
      await registerStudent();
      const token = await loginStudent();

      const response = await api('/api/admin/overview', { token });

      assert.equal(response.status, 403);
      assert.equal(errorCode(response.body), 'FORBIDDEN');
    });
  });

  describe('portfolio skills cannot be self-assigned', () => {
    it('rejects client-submitted skills with 422 and leaves stored skills untouched', async () => {
      await registerStudent();
      const token = await loginStudent();

      // Seed a legitimate, server-written skill.
      const user = await User.findOne({ email: 'phase-a@codeverse.test' });
      assert.ok(user);
      user.skills = [{ name: 'JavaScript', score: 40 }];
      await user.save();

      const attempt = await api('/api/portfolio/me', {
        method: 'PUT',
        token,
        body: {
          bio: 'Hacked bio',
          skills: [{ name: 'JavaScript', score: 100 }],
        },
      });

      assert.equal(attempt.status, 422);
      assert.equal(errorCode(attempt.body), 'FIELD_NOT_EDITABLE');

      const unchanged = await User.findOne({ email: 'phase-a@codeverse.test' });
      assert.equal(unchanged?.skills[0]?.score, 40);
      assert.equal(unchanged?.bio ?? '', '');
    });

    it('rejects other server-owned fields such as xp and role', async () => {
      await registerStudent();
      const token = await loginStudent();

      for (const field of ['xp', 'role', 'badges', 'streak']) {
        const attempt = await api('/api/portfolio/me', {
          method: 'PUT',
          token,
          body: { [field]: field === 'role' ? 'admin' : 9999 },
        });

        assert.equal(attempt.status, 422, `${field} must be rejected`);
        assert.equal(errorCode(attempt.body), 'FIELD_NOT_EDITABLE');
      }

      const user = await User.findOne({ email: 'phase-a@codeverse.test' });
      assert.equal(user?.role, 'student');
      assert.equal(user?.xp ?? 0, 0);
    });

    it('still allows editing the profile and keeps earned skills', async () => {
      await registerStudent();
      const token = await loginStudent();

      const user = await User.findOne({ email: 'phase-a@codeverse.test' });
      assert.ok(user);
      user.skills = [{ name: 'React', score: 55 }];
      await user.save();

      const update = await api('/api/portfolio/me', {
        method: 'PUT',
        token,
        body: {
          bio: 'Building small full-stack projects.',
          githubUrl: 'https://github.com/example',
          careerGoal: 'Backend engineer',
        },
      });

      assert.equal(update.status, 200);

      const updated = await User.findOne({ email: 'phase-a@codeverse.test' });
      assert.equal(updated?.bio, 'Building small full-stack projects.');
      assert.equal(updated?.careerGoal, 'Backend engineer');
      assert.equal(updated?.skills[0]?.score, 55);
      assert.equal(updated?.skills.length, 1);
    });

    it('rejects an unsafe portfolio URL', async () => {
      await registerStudent();
      const token = await loginStudent();

      const response = await api('/api/portfolio/me', {
        method: 'PUT',
        token,
        body: { portfolioWebsite: 'javascript:alert(1)' },
      });

      assert.equal(response.status, 422);
      assert.equal(errorCode(response.body), 'VALIDATION_ERROR');
    });
  });

  describe('skill progression service', () => {
    it('increments a verified skill instead of accepting an absolute score', async () => {
      await registerStudent();
      const user = await User.findOne({ email: 'phase-a@codeverse.test' });
      assert.ok(user);

      const first = await recordVerifiedSkill(String(user._id), 'Node.js', 30);
      const second = await recordVerifiedSkill(String(user._id), 'node.js', 20);

      assert.deepEqual(first, { name: 'Node.js', score: 30 });
      assert.equal(second.score, 50);
      assert.equal((await User.findById(user._id))?.skills.length, 1);
    });

    it('caps a skill at 100 and refuses invalid increments', async () => {
      await registerStudent();
      const user = await User.findOne({ email: 'phase-a@codeverse.test' });
      assert.ok(user);

      await recordVerifiedSkill(String(user._id), 'TypeScript', MAX_SKILL_SCORE);
      const capped = await recordVerifiedSkill(
        String(user._id),
        'TypeScript',
        VERIFIED_TASK_SKILL_POINTS
      );
      assert.equal(capped.score, MAX_SKILL_SCORE);

      await assert.rejects(() => recordVerifiedSkill(String(user._id), 'TypeScript', 0));
      await assert.rejects(() => recordVerifiedSkill(String(user._id), '', 10));
      await assert.rejects(() => recordVerifiedSkill('not-an-object-id', 'TypeScript', 10));
    });
  });

  describe('AI blueprint without a configured provider', () => {
    it('returns an honest 503 and never a fabricated blueprint', async () => {
      await registerStudent();
      const token = await loginStudent();

      const response = await api('/api/ai/project-blueprint', {
        method: 'POST',
        token,
        body: { projectId: BLUEPRINT_PROJECT_ID },
      });

      assert.equal(response.status, 503);
      assert.equal(errorCode(response.body), 'AI_UNAVAILABLE');
      assert.equal(response.body.blueprint, undefined);
      assert.match(
        (response.body.error as { message: string }).message,
        /no blueprint was generated/i
      );
    });

    it('rejects a malformed blueprint request with 422', async () => {
      await registerStudent();
      const token = await loginStudent();

      const response = await api('/api/ai/project-blueprint', {
        method: 'POST',
        token,
        body: {},
      });

      assert.equal(response.status, 422);
      assert.equal(errorCode(response.body), 'VALIDATION_ERROR');
    });

    it('rejects an unauthenticated blueprint request with 401', async () => {
      const response = await api('/api/ai/project-blueprint', {
        method: 'POST',
        body: { projectId: BLUEPRINT_PROJECT_ID },
      });

      assert.equal(response.status, 401);
    });
  });

  describe('API surface', () => {
    it('answers unknown routes with a structured 404', async () => {
      const response = await api('/api/definitely-not-a-route');

      assert.equal(response.status, 404);
      assert.equal(errorCode(response.body), 'NOT_FOUND');
    });

    it('reports health for the connected test database', async () => {
      const response = await api('/api/health');

      assert.equal(response.status, 200);
      assert.equal(response.body.status, 'ok');
    });
  });
});
