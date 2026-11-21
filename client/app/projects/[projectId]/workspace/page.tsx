'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronRight,
  Loader2,
  MonitorPlay,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
  User,
  XCircle,
} from 'lucide-react';
import { ProjectData } from '../../../../components/ProjectCard';
import SandboxedEditor from '../../../../components/workspace/SandboxedEditor';
import { WorkspaceFile } from '../../../../components/workspace/FileTabs';
import CodeReviewModal, { CodeReviewResult } from '../../../../components/workspace/CodeReviewModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StarButton } from '@/components/ui/StarButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/cn';
import { apiFetchRaw } from '@/lib/api';

interface ChatMessage {
  role: 'user' | 'mentor';
  content: string;
}

interface VerifyResult {
  isPassed: boolean;
  feedback: string;
}

const createInitialFiles = (projectTitle: string): WorkspaceFile[] => [
  {
    name: 'index.html',
    language: 'html',
    value: `<main class="app-shell">
  <section class="hero-card">
    <p class="eyebrow">CodeVerse Sandbox</p>
    <h1>${projectTitle}</h1>
    <p id="project-summary">Start building your project interface here.</p>
    <button id="action-btn">Run Interaction</button>
  </section>
</main>`,
  },
  {
    name: 'styles.css',
    language: 'css',
    value: `.app-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;
  background: #f4f2ed;
}

.hero-card {
  width: min(640px, 100%);
  padding: 2rem;
  border: 1px solid rgba(37, 40, 39, 0.14);
  border-radius: 18px;
  background: #fbfaf6;
  box-shadow: 0 18px 50px -30px rgba(37, 40, 39, 0.5);
}

.eyebrow {
  color: #536b58;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

h1 {
  margin: 0.75rem 0;
  font-family: 'Bodoni Moda', serif;
  font-weight: 400;
  font-size: clamp(2rem, 5vw, 3rem);
  letter-spacing: -0.03em;
  color: #252827;
}

p {
  color: #5b625e;
  line-height: 1.6;
}

button {
  margin-top: 1.25rem;
  border: 0;
  border-radius: 10px;
  padding: 0.7rem 1.15rem;
  background: #536b58;
  color: #f4f2ed;
  font-weight: 500;
  cursor: pointer;
}

button:hover {
  background: #3f5245;
}`,
  },
  {
    name: 'script.js',
    language: 'javascript',
    value: `const button = document.querySelector('#action-btn');
const summary = document.querySelector('#project-summary');

button?.addEventListener('click', () => {
  summary.textContent = 'Great! Your sandbox interaction is running inside an isolated iframe.';
  console.log('Interaction executed successfully.');
});`,
  },
];

export default function ProjectWorkspacePage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);

  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [activeFileName, setActiveFileName] = useState('index.html');

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [mentorError, setMentorError] = useState('');
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  // Task state
  const [currentTask, setCurrentTask] = useState('');

  // Verify state
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);

  // Code Review state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewResult, setReviewResult] = useState<CodeReviewResult | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const combinedCodeSnippet = useMemo(
    () => files.map((file) => `// File: ${file.name}\n${file.value}`).join('\n\n'),
    [files],
  );

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await apiFetchRaw(`/projects/${projectId}`);
        if (res.ok) {
          const data = await res.json();
          setProject(data.project);
          setFiles(createInitialFiles(data.project.title));
        }
      } catch (err) {
        console.error('Failed to load project', err);
      } finally {
        setLoading(false);
      }
    };
    if (projectId) fetchProject();
  }, [projectId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const updateFile = (fileName: string, value: string) => {
    setFiles((prev) => prev.map((file) => (file.name === fileName ? { ...file, value } : file)));
  };

  const sendMessage = async (retryMessage?: string) => {
    const outgoingMessage = (retryMessage ?? inputMessage).trim();
    if (!outgoingMessage || sending || !project) return;

    // Conversation context: the turns before this message. On a retry the user
    // turn is already on screen, so it is excluded from the history to avoid
    // sending the same question twice. The server validates and caps history.
    const historySource =
      retryMessage &&
      chatMessages[chatMessages.length - 1]?.role === 'user' &&
      chatMessages[chatMessages.length - 1]?.content === outgoingMessage
        ? chatMessages.slice(0, -1)
        : chatMessages;
    const history = historySource.slice(-12).map(({ role, content }) => ({ role, content }));

    if (!retryMessage) {
      setChatMessages((prev) => [...prev, { role: 'user', content: outgoingMessage }]);
      setInputMessage('');
    }
    setSending(true);
    setMentorError('');
    setLastFailedMessage(null);

    try {
      const res = await apiFetchRaw('/mentor/ask', {
        method: 'POST',
        body: JSON.stringify({
          projectId: project._id,
          taskContext: currentTask,
          codeSnippet: combinedCodeSnippet,
          userMessage: outgoingMessage,
          mode: 'project-help',
          history,
        }),
      });

      const payload = await res.json().catch(() => ({}));

      if (res.ok && typeof payload?.reply === 'string' && payload.reply.trim().length > 0) {
        setChatMessages((prev) => [...prev, { role: 'mentor', content: payload.reply }]);
      } else {
        setMentorError(
          payload?.error?.message ||
            'The mentor is unavailable right now. Your message was not answered.'
        );
        setLastFailedMessage(outgoingMessage);
      }
    } catch {
      setMentorError('Cannot reach the mentor service. Your message was not answered.');
      setLastFailedMessage(outgoingMessage);
    } finally {
      setSending(false);
    }
  };

  const handleVerifyTask = async () => {
    if (!currentTask.trim() || !combinedCodeSnippet.trim() || verifying || !project) return;

    setVerifying(true);
    setVerifyResult(null);

    try {
      const res = await apiFetchRaw('/mentor/verify', {
        method: 'POST',
        body: JSON.stringify({
          projectId: project._id,
          taskDescription: currentTask,
          codeSnippet: combinedCodeSnippet,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setVerifyResult(data);
      } else {
        const payload = await res.json().catch(() => ({}));
        setVerifyResult({
          isPassed: false,
          feedback:
            payload?.error?.message ||
            'Automated verification is unavailable right now. Your task was not evaluated.',
        });
      }
    } catch {
      setVerifyResult({
        isPassed: false,
        feedback: 'Verification service unreachable. Your task was not evaluated.',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleCodeReview = async () => {
    if (!combinedCodeSnippet.trim() || reviewLoading || !project) return;

    setReviewLoading(true);
    setReviewError('');
    setReviewResult(null);
    setReviewOpen(true);

    try {
      const res = await apiFetchRaw('/evaluator/review', {
        method: 'POST',
        body: JSON.stringify({
          projectId: project._id,
          taskDescription: currentTask, // Optional context
          codeSnippet: combinedCodeSnippet,
          language: 'mixed',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReviewResult(data.review);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setReviewError(errorData?.error?.message || 'Review failed. Your code was not evaluated.');
      }
    } catch {
      setReviewError('Review service unavailable (network error).');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-5 w-5 animate-spin text-forest" aria-label="Loading workspace" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-[100dvh] items-center justify-center p-6">
        <EmptyState
          title="Project not found"
          description="This workspace could not be opened because the project specification is missing."
          action={
            <Button href="/dashboard/projects" variant="secondary" size="sm">
              Back to projects
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden text-ink">
      {/* Header */}
      <header className="flex h-[60px] shrink-0 items-center justify-between gap-4 border-b border-ink/10 bg-ivory-warm/80 px-4 backdrop-blur-md sm:px-6">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[12px] text-ink-faint">
          <Link href="/dashboard/projects" className="shrink-0 transition-colors hover:text-ink">
            Projects
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
          <Link
            href={`/projects/${project.slug || project._id}`}
            className="max-w-[140px] truncate transition-colors hover:text-ink sm:max-w-[240px]"
          >
            {project.title}
          </Link>
          <ChevronRight className="hidden h-3 w-3 shrink-0 sm:block" aria-hidden="true" />
          <span className="hidden shrink-0 text-ink-soft sm:block">Workspace</span>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Badge tone="sage" className="hidden sm:inline-flex">
            <MonitorPlay className="h-3 w-3" aria-hidden="true" />
            Browser sandbox
          </Badge>
          <Link
            href={`/projects/${project.slug || project._id}/blueprint`}
            className="text-[12px] text-forest underline-offset-4 transition-colors hover:text-forest-deep hover:underline"
          >
            Blueprint
          </Link>
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Editor column */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Task bar */}
          <div className="shrink-0 border-b border-ink/10 bg-ivory-warm/55 p-3 sm:p-4">
            <div className="flex flex-col gap-2.5 lg:flex-row lg:items-end">
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="current-task"
                  className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint"
                >
                  Current task
                </label>
                <input
                  id="current-task"
                  type="text"
                  value={currentTask}
                  onChange={(e) => setCurrentTask(e.target.value)}
                  placeholder='e.g. "Create an interactive hero card and button behaviour"'
                  className="control h-10"
                />
              </div>

              <div className="flex shrink-0 gap-2">
                <StarButton
                  type="button"
                  onClick={handleVerifyTask}
                  disabled={verifying || !currentTask.trim() || !combinedCodeSnippet.trim()}
                  className="h-10"
                >
                  {verifying ? 'Verifying…' : 'Verify task'}
                </StarButton>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleCodeReview}
                  disabled={reviewLoading || !combinedCodeSnippet.trim()}
                  className="h-10"
                >
                  <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                  Full review
                </Button>
              </div>
            </div>
          </div>

          <SandboxedEditor
            files={files}
            activeFileName={activeFileName}
            onSelectFile={setActiveFileName}
            onChangeFile={updateFile}
          />

          {verifyResult ? (
            <div
              role="status"
              className={cn(
                'flex shrink-0 items-start gap-3 border-t px-4 py-3',
                verifyResult.isPassed
                  ? 'border-forest/25 bg-forest/[0.07]'
                  : 'border-[var(--color-danger)]/25 bg-[var(--color-danger-tint)]',
              )}
            >
              {verifyResult.isPassed ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-forest" aria-hidden="true" />
              ) : (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-danger)]" aria-hidden="true" />
              )}
              <div>
                <p
                  className={cn(
                    'text-[13px] font-medium',
                    verifyResult.isPassed ? 'text-forest-deep' : 'text-[var(--color-danger)]',
                  )}
                >
                  {verifyResult.isPassed ? 'Task verified' : 'Not verified'}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">{verifyResult.feedback}</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Mentor column */}
        <aside className="flex h-[380px] shrink-0 flex-col border-t border-ink/10 bg-ivory-warm/55 lg:h-auto lg:w-[380px] lg:border-l lg:border-t-0">
          <div className="flex shrink-0 items-center gap-2.5 border-b border-ink/10 px-4 py-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-forest text-ivory-warm">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-[13px] font-medium text-ink">AI code mentor</h2>
              <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-faint">
                Reads every sandbox file
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {chatMessages.length === 0 ? (
              <div className="space-y-3 py-6 text-center">
                <Bot className="mx-auto h-8 w-8 text-ink-faint" aria-hidden="true" />
                <p className="text-[12.5px] leading-relaxed text-ink-muted">
                  Ask anything about <span className="font-medium text-ink">{project.title}</span>. The
                  mentor can see your HTML, CSS, JavaScript and the current task.
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {['Review my files', 'Suggest next step', 'Debug the preview'].map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => setInputMessage(question)}
                      className="rounded-full border border-ink/15 px-2.5 py-1 text-[11px] text-ink-muted transition-colors hover:border-forest/40 hover:text-forest"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={cn('flex gap-2', message.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {message.role === 'mentor' ? (
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] bg-forest text-ivory-warm">
                    <Bot className="h-3 w-3" aria-hidden="true" />
                  </span>
                ) : null}
                <div
                  className={cn(
                    'max-w-[85%] rounded-[11px] px-3 py-2 text-[12px] leading-relaxed',
                    message.role === 'user'
                      ? 'rounded-br-[3px] bg-forest text-ivory-warm'
                      : 'rounded-bl-[3px] border border-ink/10 bg-ivory-warm/80 text-ink-soft',
                  )}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
                {message.role === 'user' ? (
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] border border-ink/15 text-ink-faint">
                    <User className="h-3 w-3" aria-hidden="true" />
                  </span>
                ) : null}
              </div>
            ))}

            {sending ? (
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                Mentor is reading your files…
              </p>
            ) : null}

            <div ref={chatEndRef} />
          </div>

          {mentorError ? (
            <div
              role="alert"
              className="mx-3 mb-2 flex items-start gap-2 rounded-control border border-[var(--color-danger)]/25 bg-[var(--color-danger-tint)] p-3"
            >
              <AlertTriangle
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-danger)]"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-[11.5px] leading-relaxed text-ink-soft">{mentorError}</p>
                {lastFailedMessage ? (
                  <button
                    type="button"
                    onClick={() => sendMessage(lastFailedMessage)}
                    disabled={sending}
                    className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[var(--color-danger)] underline-offset-4 hover:underline disabled:opacity-50"
                  >
                    <RefreshCw className="h-3 w-3" aria-hidden="true" />
                    Try again
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="shrink-0 border-t border-ink/10 p-3">
            <div className="flex items-end gap-2">
              <label htmlFor="mentor-input" className="sr-only">
                Ask the mentor
              </label>
              <textarea
                id="mentor-input"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your AI mentor…"
                rows={2}
                className="control resize-none text-[12px]"
              />
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={sending || !inputMessage.trim()}
                aria-label="Send message to mentor"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-forest text-ivory-warm transition-colors hover:bg-forest-deep disabled:opacity-40"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      <CodeReviewModal
        isOpen={reviewOpen}
        loading={reviewLoading}
        error={reviewError}
        review={reviewResult}
        onClose={() => setReviewOpen(false)}
        onRetry={handleCodeReview}
      />
    </div>
  );
}
