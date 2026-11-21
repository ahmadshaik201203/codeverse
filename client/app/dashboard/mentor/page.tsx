'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Bot,
  Briefcase,
  Bug,
  FolderGit2,
  Lightbulb,
  ListChecks,
  Loader2,
  Mic2,
  RefreshCw,
  Send,
  User,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import { apiFetch, ApiError } from '@/lib/api';

type MentorMode =
  | 'learn'
  | 'debug'
  | 'explain'
  | 'quiz'
  | 'interview'
  | 'project-help'
  | 'career-help';

interface ModeConfig {
  id: MentorMode;
  label: string;
  blurb: string;
  icon: typeof BookOpen;
  suggestions: string[];
}

const MODES: ModeConfig[] = [
  {
    id: 'learn',
    label: 'Learn',
    blurb: 'Guided, Socratic teaching',
    icon: BookOpen,
    suggestions: [
      'Teach me closures in JavaScript with a small exercise.',
      'How should I approach learning system design?',
    ],
  },
  {
    id: 'debug',
    label: 'Debug',
    blurb: 'Find the root cause',
    icon: Bug,
    suggestions: [
      'My useEffect runs twice and fetches data twice. Why?',
      'Explain this error: "Cannot read properties of undefined".',
    ],
  },
  {
    id: 'explain',
    label: 'Explain',
    blurb: 'Clear concept breakdowns',
    icon: Lightbulb,
    suggestions: [
      'Explain database indexing like I am new to databases.',
      'What is the difference between authentication and authorization?',
    ],
  },
  {
    id: 'quiz',
    label: 'Quiz me',
    blurb: 'One question at a time',
    icon: ListChecks,
    suggestions: [
      'Quiz me on React fundamentals.',
      'Quiz me on Python data structures.',
    ],
  },
  {
    id: 'interview',
    label: 'Interview me',
    blurb: 'Mock technical interview',
    icon: Mic2,
    suggestions: [
      'Start a mock interview for a frontend internship.',
      'Interview me for a backend role focused on APIs.',
    ],
  },
  {
    id: 'project-help',
    label: 'Project help',
    blurb: 'Unblock your current build',
    icon: FolderGit2,
    suggestions: [
      'How do I structure a Next.js project for a dashboard?',
      'How should I plan the database for a booking app?',
    ],
  },
  {
    id: 'career-help',
    label: 'Career help',
    blurb: 'Roles, skills and next steps',
    icon: Briefcase,
    suggestions: [
      'What should a first-year student focus on for a 2027 internship?',
      'How do I present a college project on my resume?',
    ],
  },
];

interface MentorMessage {
  role: 'user' | 'mentor';
  content: string;
  mode?: MentorMode;
}

const modeLabel = (mode: MentorMode): string =>
  MODES.find((entry) => entry.id === mode)?.label ?? mode;

export default function MentorPage() {
  const [mode, setMode] = useState<MentorMode>('learn');
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [lastAttempt, setLastAttempt] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, sending]);

  const activeMode = MODES.find((entry) => entry.id === mode) ?? MODES[0];

  const send = async (raw: string, appendUser = true) => {
    const content = raw.trim();
    if (!content || sending) return;

    // The turns before this message; on retry the user turn is already shown.
    const historySource =
      !appendUser && messages[messages.length - 1]?.role === 'user'
        ? messages.slice(0, -1)
        : messages;
    const history = historySource.slice(-12).map(({ role, content: text }) => ({
      role,
      content: text,
    }));

    if (appendUser) {
      setMessages((prev) => [...prev, { role: 'user', content }]);
      setInput('');
    }
    setSending(true);
    setError('');
    setLastAttempt(null);

    try {
      const data = await apiFetch<{ reply: string }>('/mentor/ask', {
        method: 'POST',
        body: JSON.stringify({ userMessage: content, mode, history }),
      });

      if (!data?.reply || typeof data.reply !== 'string' || data.reply.trim().length === 0) {
        setError('The mentor did not return an answer. Nothing was displayed.');
        setLastAttempt(content);
        return;
      }

      setMessages((prev) => [...prev, { role: 'mentor', content: data.reply, mode }]);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'The mentor could not answer. Nothing was displayed.'
      );
      setLastAttempt(content);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void send(input);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge tone="sage">
              <Bot className="h-3 w-3" aria-hidden="true" />
              AI mentor
            </Badge>
            <h1 className="mt-3 font-serif text-[clamp(1.7rem,3vw,2.2rem)] leading-tight tracking-[-0.03em] text-ink">
              Ask, practise, get unstuck
            </h1>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-ink-muted">
              Pick a mode. Every answer comes from the live AI model with the conversation context
              you build here — nothing is pre-written.
            </p>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            {modeLabel(mode)} mode
          </p>
        </div>

        <div
          role="group"
          aria-label="Mentor mode"
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
        >
          {MODES.map((entry) => {
            const Icon = entry.icon;
            const active = entry.id === mode;
            return (
              <button
                key={entry.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setMode(entry.id);
                  setError('');
                }}
                className={cn(
                  'flex items-start gap-2.5 rounded-card border p-3 text-left transition-colors',
                  active
                    ? 'border-forest/40 bg-forest/[0.07]'
                    : 'border-ink/10 bg-ivory-warm/55 hover:border-ink/25 hover:bg-ivory-warm/80'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border',
                    active
                      ? 'border-forest/30 bg-forest text-ivory-warm'
                      : 'border-ink/15 text-ink-muted'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[12.5px] font-medium text-ink">{entry.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-ink-faint">
                    {entry.blurb}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <Card tone="strong" className="flex min-h-[440px] flex-col overflow-hidden">
          <div
            role="log"
            aria-live="polite"
            aria-label="Mentor conversation"
            className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6"
          >
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 py-10 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-forest text-ivory-warm">
                  <activeMode.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-serif text-[19px] tracking-[-0.02em] text-ink">
                    {activeMode.label} mode
                  </h2>
                  <p className="mx-auto mt-1 max-w-sm text-[12.5px] leading-relaxed text-ink-muted">
                    Start with a question, or pick one of these prompts.
                  </p>
                </div>
                <div className="flex max-w-xl flex-col gap-2">
                  {activeMode.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void send(suggestion)}
                      className="group flex items-center justify-between gap-3 rounded-control border border-ink/12 bg-ivory-warm/60 px-3.5 py-2.5 text-left text-[12.5px] text-ink-soft transition-colors hover:border-forest/35 hover:text-forest"
                    >
                      {suggestion}
                      <ArrowUpRight
                        className="h-3.5 w-3.5 shrink-0 text-ink-faint transition-colors group-hover:text-forest"
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn('flex gap-2.5', message.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {message.role === 'mentor' ? (
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-forest text-ivory-warm">
                    <Bot className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                ) : null}
                <div className={cn('max-w-[85%]', message.role === 'user' && 'order-first')}>
                  {message.role === 'mentor' && message.mode ? (
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-faint">
                      {modeLabel(message.mode)}
                    </p>
                  ) : null}
                  <div
                    className={cn(
                      'whitespace-pre-wrap rounded-[11px] px-3.5 py-2.5 text-[12.5px] leading-relaxed',
                      message.role === 'user'
                        ? 'rounded-br-[3px] bg-forest text-ivory-warm'
                        : 'rounded-bl-[3px] border border-ink/10 bg-ivory-warm/80 text-ink-soft'
                    )}
                  >
                    {message.content}
                  </div>
                </div>
                {message.role === 'user' ? (
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] border border-ink/15 text-ink-faint">
                    <User className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                ) : null}
              </div>
            ))}

            {sending ? (
              <p
                role="status"
                className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint"
              >
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                The mentor is thinking…
              </p>
            ) : null}

            <div ref={endRef} />
          </div>

          {error ? (
            <div
              role="alert"
              className="mx-4 mb-3 flex items-start gap-2.5 rounded-control border border-[var(--color-danger)]/25 bg-[var(--color-danger-tint)] p-3 sm:mx-6"
            >
              <AlertTriangle
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-danger)]"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-[12px] leading-relaxed text-ink-soft">{error}</p>
                {lastAttempt ? (
                  <button
                    type="button"
                    onClick={() => void send(lastAttempt, false)}
                    disabled={sending}
                    className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-danger)] underline-offset-4 hover:underline disabled:opacity-50"
                  >
                    <RefreshCw className="h-3 w-3" aria-hidden="true" />
                    Try again
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          <form
            onSubmit={handleSubmit}
            className="flex shrink-0 items-end gap-2 border-t border-ink/10 p-3 sm:p-4"
          >
            <label htmlFor="mentor-message" className="sr-only">
              Message the AI mentor
            </label>
            <textarea
              id="mentor-message"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void send(input);
                }
              }}
              rows={2}
              placeholder={`Ask in ${modeLabel(mode).toLowerCase()} mode…`}
              className="control resize-none text-[12.5px]"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send message to mentor"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-forest text-ivory-warm transition-colors hover:bg-forest-deep disabled:opacity-40"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
