import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiFetch, ApiError } from '@/lib/api';
import MentorPage from '@/app/dashboard/mentor/page';

vi.mock('@/components/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return { ...actual, apiFetch: vi.fn() };
});

const mockedApiFetch = vi.mocked(apiFetch);

const askCalls = () =>
  mockedApiFetch.mock.calls.filter(([endpoint]) => endpoint === '/mentor/ask').length;

describe('AI mentor page', () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  it('renders every mentor mode', () => {
    render(<MentorPage />);

    const modes = within(screen.getByRole('group', { name: /mentor mode/i }));
    for (const label of [
      'Learn',
      'Debug',
      'Explain',
      'Quiz me',
      'Interview me',
      'Project help',
      'Career help',
    ]) {
      expect(modes.getByRole('button', { name: new RegExp(label, 'i') })).toBeTruthy();
    }
  });

  it('sends the selected mode and shows loading, then the real reply', async () => {
    let resolveReply: (value: { reply: string }) => void = () => undefined;
    mockedApiFetch.mockImplementation(
      () => new Promise<{ reply: string }>((resolve) => (resolveReply = resolve))
    );

    render(<MentorPage />);
    await userEvent.click(
      within(screen.getByRole('group', { name: /mentor mode/i })).getByRole('button', {
        name: /debug/i,
      })
    );
    await userEvent.type(screen.getByLabelText(/message the ai mentor/i), 'Why is my hook looping?');
    await userEvent.click(screen.getByRole('button', { name: /send message to mentor/i }));

    expect(screen.getByText(/the mentor is thinking/i)).toBeTruthy();

    const calls = mockedApiFetch.mock.calls;
    const [, options] = calls[calls.length - 1] ?? [];
    const body = JSON.parse(String(options?.body));
    expect(body.mode).toBe('debug');
    expect(body.userMessage).toBe('Why is my hook looping?');

    resolveReply({ reply: 'A dependency changes on every render.' });

    expect(await screen.findByText('A dependency changes on every render.')).toBeTruthy();
    expect(screen.queryByText(/the mentor is thinking/i)).toBeNull();
  });

  it('shows the server error and retries the same question', async () => {
    mockedApiFetch.mockRejectedValue(
      new ApiError(
        'The AI mentor is not configured on this server. No answer was generated.',
        503,
        'AI_UNAVAILABLE'
      )
    );

    render(<MentorPage />);
    await userEvent.type(screen.getByLabelText(/message the ai mentor/i), 'Explain closures.');
    await userEvent.click(screen.getByRole('button', { name: /send message to mentor/i }));

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText(/no answer was generated/i)).toBeTruthy();
    expect(screen.queryByText(/pretend/i)).toBeNull();

    const before = askCalls();
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => expect(askCalls()).toBe(before + 1));

    // The retry must not duplicate the learner's message on screen.
    expect(screen.getAllByText('Explain closures.')).toHaveLength(1);
  });
});
