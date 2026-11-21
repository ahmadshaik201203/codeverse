'use client';

import React, { useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Gauge,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SecurityFinding {
  severity: 'High' | 'Medium' | 'Low' | string;
  issue: string;
  recommendation: string;
}

export interface PerformanceObservation {
  category: 'Render' | 'Memory' | 'Network' | 'Execution' | string;
  observation: string;
  suggestion: string;
}

export interface CodeReviewResult {
  overallScore: number;
  verdict: 'Passed' | 'Needs Improvement' | 'Failed' | string;
  summary: string;
  security: SecurityFinding[];
  performance: PerformanceObservation[];
  bestPractices: string[];
}

interface CodeReviewModalProps {
  isOpen: boolean;
  loading: boolean;
  error: string;
  review: CodeReviewResult | null;
  onClose: () => void;
  onRetry?: () => void;
}

const getSeverityClasses = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'high':
      return 'border-[var(--color-danger)]/30 bg-[var(--color-danger-tint)] text-[var(--color-danger)]';
    case 'medium':
      return 'border-amber-300/70 bg-amber-50 text-amber-700';
    case 'low':
      return 'border-forest/25 bg-sage-mist text-forest-deep';
    default:
      return 'border-ink/15 bg-ivory-warm/60 text-ink-muted';
  }
};

const getScoreClasses = (score: number) => {
  if (score >= 85) return 'border-forest/30 bg-forest/[0.08] text-forest-deep';
  if (score >= 65) return 'border-amber-300/70 bg-amber-50 text-amber-700';
  return 'border-[var(--color-danger)]/30 bg-[var(--color-danger-tint)] text-[var(--color-danger)]';
};

export default function CodeReviewModal({
  isOpen,
  loading,
  error,
  review,
  onClose,
  onRetry,
}: CodeReviewModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4 backdrop-blur-[2px]"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="code-review-title"
        className="surface-strong flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-panel shadow-lift"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-ink/10 bg-ivory-warm/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-forest text-ivory-warm">
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 id="code-review-title" className="text-[15px] font-medium text-ink">
                Automated code review
              </h2>
              <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-faint">
                Security, performance &amp; quality
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-[7px] p-2 text-ink-faint transition-colors hover:bg-ink/[0.06] hover:text-ink"
            aria-label="Close code review dialog"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center" role="status">
              <div className="relative">
                <div className="h-12 w-12 animate-spin rounded-full border-2 border-ink/10 border-t-forest" />
                <Sparkles className="absolute inset-0 m-auto h-4 w-4 animate-pulse text-forest" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-[15px] font-medium text-ink">Reviewing your codebase…</h3>
                <p className="mx-auto mt-1 max-w-md text-[12.5px] leading-relaxed text-ink-muted">
                  The evaluator is checking correctness, security, performance, accessibility and code
                  quality.
                </p>
              </div>
            </div>
          ) : null}

          {!loading && error ? (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-card border border-[var(--color-danger)]/30 bg-[var(--color-danger-tint)] p-4"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-danger)]" aria-hidden="true" />
              <div>
                <h3 className="text-[13.5px] font-medium text-[var(--color-danger)]">Review failed</h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">{error}</p>
                {onRetry ? (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-control border border-[var(--color-danger)]/30 bg-ivory-warm/70 px-3 py-1.5 text-[12px] font-medium text-[var(--color-danger)] transition-colors hover:bg-ivory-warm"
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    Try review again
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {!loading && !error && review ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
                <div className={cn('rounded-card border p-5', getScoreClasses(review.overallScore))}>
                  <div className="mb-4 flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.16em] opacity-90">
                    <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
                    Overall score
                  </div>
                  <div className="font-serif text-5xl leading-none tracking-[-0.04em]">
                    {review.overallScore}
                  </div>
                  <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em]">
                    {review.verdict}
                  </div>
                </div>

                <div className="rounded-card border border-ink/10 bg-ivory-warm/55 p-5">
                  <div className="mb-3 flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-faint">
                    <Sparkles className="h-3.5 w-3.5 text-forest" aria-hidden="true" />
                    Executive summary
                  </div>
                  <p className="text-[13px] leading-relaxed text-ink-soft">{review.summary}</p>
                </div>
              </div>

              <section className="space-y-4 rounded-card border border-ink/10 bg-ivory-warm/45 p-5">
                <h3 className="flex items-center gap-2 text-[13.5px] font-medium text-ink">
                  <ShieldAlert className="h-4 w-4 text-[var(--color-danger)]" aria-hidden="true" />
                  Security findings
                </h3>

                {review.security.length > 0 ? (
                  <div className="space-y-3">
                    {review.security.map((finding, index) => (
                      <div key={index} className="rounded-[11px] border border-ink/10 bg-ivory-warm/70 p-4">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em]',
                              getSeverityClasses(finding.severity),
                            )}
                          >
                            {finding.severity}
                          </span>
                          <span className="text-[13px] font-medium text-ink">{finding.issue}</span>
                        </div>
                        <p className="text-[12.5px] leading-relaxed text-ink-muted">
                          <span className="font-medium text-ink-soft">Fix:</span> {finding.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12.5px] text-ink-faint">
                    No major security findings returned by the evaluator.
                  </p>
                )}
              </section>

              <section className="space-y-4 rounded-card border border-ink/10 bg-ivory-warm/45 p-5">
                <h3 className="flex items-center gap-2 text-[13.5px] font-medium text-ink">
                  <Zap className="h-4 w-4 text-amber-600" aria-hidden="true" />
                  Performance observations
                </h3>

                {review.performance.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {review.performance.map((item, index) => (
                      <div key={index} className="rounded-[11px] border border-ink/10 bg-ivory-warm/70 p-4">
                        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-amber-700">
                          {item.category}
                        </span>
                        <p className="mt-2 text-[13px] text-ink">{item.observation}</p>
                        <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">
                          <span className="font-medium text-ink-soft">Improve:</span> {item.suggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12.5px] text-ink-faint">
                    No performance issues returned by the evaluator.
                  </p>
                )}
              </section>

              <section className="space-y-4 rounded-card border border-ink/10 bg-ivory-warm/45 p-5">
                <h3 className="flex items-center gap-2 text-[13.5px] font-medium text-ink">
                  <CheckCircle2 className="h-4 w-4 text-forest" aria-hidden="true" />
                  Best practice recommendations
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {review.bestPractices.map((practice, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2.5 rounded-[11px] border border-ink/10 bg-ivory-warm/70 p-3"
                    >
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest" aria-hidden="true" />
                      <p className="text-[12.5px] leading-relaxed text-ink-soft">{practice}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
