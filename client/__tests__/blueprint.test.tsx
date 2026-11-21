import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiFetch, ApiError } from '@/lib/api';
import ProjectBlueprintPage from '@/app/projects/[projectId]/blueprint/page';

vi.mock('next/navigation', () => ({
  useParams: () => ({ projectId: 'project-1' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/projects/project-1/blueprint',
}));

vi.mock('@/components/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return { ...actual, apiFetch: vi.fn() };
});

const mockedApiFetch = vi.mocked(apiFetch);

const project = {
  _id: 'project-1',
  slug: 'ai-ecommerce-platform',
  title: 'AI E-commerce Platform',
};

const blueprint = {
  architecture: 'Next.js frontend with an Express API and MongoDB.',
  steps: [
    {
      phase: 'Phase 1: Data model',
      tasks: ['Design the schema', 'Seed the catalogue'],
      learningObjectives: ['Model relational data with MongoDB'],
      deliverables: ['A documented schema'],
    },
  ],
  bestPractices: ['Validate every request server-side.'],
};

const savedBlueprint = {
  blueprint,
  generated: true,
  saved: true,
  model: 'gemini-2.5-flash',
  generatedAt: '2026-11-20T10:00:00.000Z',
};

const noSavedBlueprint = () =>
  Promise.reject(
    new ApiError('No saved blueprint exists for this project yet.', 404, 'BLUEPRINT_NOT_FOUND')
  );

interface FlowHandlers {
  saved?: () => Promise<unknown>;
  generate?: () => Promise<unknown>;
}

const mockFlow = (handlers: FlowHandlers) => {
  mockedApiFetch.mockImplementation((endpoint: string, options?: RequestInit) => {
    if (endpoint === '/projects/project-1') return Promise.resolve({ project });
    if (endpoint === '/ai/project-blueprint/project-1') {
      return (handlers.saved ?? noSavedBlueprint)() as Promise<never>;
    }
    if (endpoint === '/ai/project-blueprint' && options?.method === 'POST') {
      return handlers.generate
        ? (handlers.generate() as Promise<never>)
        : Promise.reject(new Error('Unexpected generation request'));
    }
    return Promise.reject(new Error(`Unexpected endpoint ${endpoint}`));
  });
};

const generateCalls = () =>
  mockedApiFetch.mock.calls.filter(
    ([endpoint, options]) =>
      endpoint === '/ai/project-blueprint' && options?.method === 'POST'
  ).length;

describe('Blueprint page', () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  it('shows a loading state while the saved blueprint request is in flight', () => {
    mockedApiFetch.mockImplementation((endpoint: string) => {
      if (endpoint === '/projects/project-1') return Promise.resolve({ project });
      return new Promise(() => undefined);
    });

    render(<ProjectBlueprintPage />);

    expect(
      screen.getByRole('heading', { name: /generating the architecture blueprint/i })
    ).toBeTruthy();
  });

  it('loads a previously saved blueprint without calling the AI again', async () => {
    mockFlow({ saved: () => Promise.resolve(savedBlueprint) });

    render(<ProjectBlueprintPage />);

    expect(await screen.findByText('Phase 1: Data model')).toBeTruthy();
    expect(screen.getByText('Saved AI blueprint')).toBeTruthy();
    expect(screen.getByText(/gemini-2\.5-flash/)).toBeTruthy();
    expect(screen.getByText('Learning objectives')).toBeTruthy();
    expect(screen.getByText('Deliverables')).toBeTruthy();
    expect(generateCalls()).toBe(0);
  });

  it('generates a blueprint only when no saved one exists', async () => {
    mockFlow({
      saved: noSavedBlueprint,
      generate: () => Promise.resolve({ blueprint, generated: true, saved: true }),
    });

    render(<ProjectBlueprintPage />);

    expect(await screen.findByText('Design the schema')).toBeTruthy();
    expect(screen.getByText('A documented schema')).toBeTruthy();
    expect(generateCalls()).toBe(1);
  });

  it('shows an honest unavailable message and no blueprint when the AI is not configured', async () => {
    mockFlow({
      saved: noSavedBlueprint,
      generate: () =>
        Promise.reject(
          new ApiError(
            'Blueprint generation is unavailable because the AI provider is not configured. No blueprint was generated.',
            503,
            'AI_UNAVAILABLE'
          )
        ),
    });

    render(<ProjectBlueprintPage />);

    expect(await screen.findByText(/AI blueprint generation is unavailable/i)).toBeTruthy();
    expect(screen.getByText(/no blueprint was generated/i)).toBeTruthy();
    // No fabricated content: no phases, no architecture, no progress.
    expect(screen.queryByText('Phase 1: Data model')).toBeNull();
    expect(screen.queryByText(/system architecture/i)).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByRole('button', { name: /try again/i })).toBeTruthy();
  });

  it('retries generation when the learner asks again', async () => {
    mockFlow({
      saved: noSavedBlueprint,
      generate: () =>
        Promise.reject(new ApiError('Provider unavailable.', 503, 'AI_UNAVAILABLE')),
    });

    render(<ProjectBlueprintPage />);
    await screen.findByText(/AI blueprint generation is unavailable/i);

    const callsBeforeRetry = generateCalls();
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => expect(generateCalls()).toBe(callsBeforeRetry + 1));
  });

  it('refuses to render a response the server did not mark as generated', async () => {
    mockFlow({
      saved: noSavedBlueprint,
      generate: () => Promise.resolve({ blueprint, generated: false }),
    });

    render(<ProjectBlueprintPage />);

    expect(await screen.findByText(/no blueprint was returned/i)).toBeTruthy();
    expect(screen.queryByText('Phase 1: Data model')).toBeNull();
  });

  it('reports a project lookup failure instead of a blueprint error', async () => {
    mockedApiFetch.mockRejectedValue(
      new ApiError('This project does not exist.', 404, 'NOT_FOUND')
    );

    render(<ProjectBlueprintPage />);

    expect(await screen.findByText(/project not found/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /try again/i })).toBeNull();
  });
});
