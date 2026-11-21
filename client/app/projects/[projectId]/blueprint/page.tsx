'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Award, Check, ChevronRight, Layers, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { ProjectData } from '../../../../components/ProjectCard';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/cn';
import { apiFetch, ApiError } from '@/lib/api';

interface BlueprintStep {
  phase: string;
  tasks: string[];
  learningObjectives?: string[];
  deliverables?: string[];
}

interface BlueprintData {
  architecture: string;
  steps: BlueprintStep[];
  bestPractices: string[];
  note?: string;
}

interface BlueprintResponse {
  blueprint: BlueprintData;
  generated: boolean;
  saved?: boolean;
  model?: string;
  generatedAt?: string;
}

interface BlueprintError {
  title: string;
  description: string;
  retryable: boolean;
}

const describeError = (error: unknown): BlueprintError => {
  if (error instanceof ApiError) {
    if (error.code === 'AI_UNAVAILABLE' || error.status === 503) {
      return {
        title: 'AI blueprint generation is unavailable',
        description:
          'The AI provider is not configured on this server, so no blueprint was generated. Nothing on this page is placeholder content — configure the AI provider and try again.',
        retryable: true,
      };
    }
    if (error.status === 502) {
      return {
        title: 'The AI architect could not produce a blueprint',
        description: `${error.message} You can try again in a moment.`,
        retryable: true,
      };
    }
    if (error.status === 404) {
      return {
        title: 'Project not found',
        description: 'This project does not exist or is no longer available.',
        retryable: false,
      };
    }
    return { title: 'Blueprint could not be generated', description: error.message, retryable: true };
  }

  return {
    title: 'Blueprint could not be generated',
    description:
      error instanceof Error ? error.message : 'An unexpected error occurred while generating the blueprint.',
    retryable: true,
  };
};

export default function ProjectBlueprintPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [blueprint, setBlueprint] = useState<BlueprintData | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<{ [key: string]: boolean }>({});
  const [savedMeta, setSavedMeta] = useState<{ saved: boolean; model?: string; generatedAt?: string } | null>(
    null
  );
  const [error, setError] = useState<BlueprintError | null>(null);
  // React StrictMode invokes effects twice in development. Generation costs a
  // real AI call, so the first load must happen only once.
  const initialLoadFor = useRef<string | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'regenerate') => {
      if (mode === 'initial') setInitialLoading(true);
      else setRegenerating(true);

      setError(null);

      try {
        if (!project) {
          const projectResponse = await apiFetch<{ project: ProjectData }>(`/projects/${projectId}`);
          setProject(projectResponse.project);
        }

        let response: BlueprintResponse | null = null;

        // Prefer the learner's saved blueprint; generate only when none exists.
        if (mode === 'initial') {
          try {
            response = await apiFetch<BlueprintResponse>(`/ai/project-blueprint/${projectId}`);
          } catch (err) {
            if (!(err instanceof ApiError) || err.status !== 404) throw err;
          }
        }

        if (!response) {
          response = await apiFetch<BlueprintResponse>('/ai/project-blueprint', {
            method: 'POST',
            body: JSON.stringify({ projectId }),
          });
        }

        // Only a response the server marked as generated is displayed.
        if (!response?.generated || !response.blueprint?.steps?.length) {
          setBlueprint(null);
          setError({
            title: 'No blueprint was returned',
            description:
              'The server did not confirm that a blueprint was generated, so nothing is displayed. Try again.',
            retryable: true,
          });
          return;
        }

        setBlueprint(response.blueprint);
        setSavedMeta({
          saved: !!response.saved,
          model: response.model,
          generatedAt: response.generatedAt,
        });
        setCompletedTasks({});
      } catch (err: unknown) {
        setBlueprint(null);
        setError(describeError(err));
      } finally {
        setInitialLoading(false);
        setRegenerating(false);
      }
    },
    [project, projectId]
  );

  useEffect(() => {
    if (!projectId || initialLoadFor.current === projectId) return;
    initialLoadFor.current = projectId;
    load('initial');
    // `load` is intentionally omitted: the effect should run once per project id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const toggleTask = (taskKey: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskKey]: !prev[taskKey],
    }));
  };

  const totalTasks = blueprint?.steps?.reduce((acc, step) => acc + step.tasks.length, 0) || 0;
  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  if (initialLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center gap-4 py-28 text-center">
          <Spinner />
          <h2 className="font-serif text-[22px] tracking-[-0.02em] text-ink">
            Generating the architecture blueprint
          </h2>
          <p className="max-w-sm text-[13px] leading-relaxed text-ink-muted">
            The AI architect is reading the project specification and breaking it into milestones and a
            guided checklist.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <EmptyState
          tone="error"
          title={error.title}
          description={error.description}
          action={
            error.retryable ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => load('initial')}
                disabled={regenerating}
              >
                <RefreshCw className={cn('h-3.5 w-3.5', regenerating && 'animate-spin')} aria-hidden="true" />
                Try again
              </Button>
            ) : (
              <Button href="/dashboard/projects" variant="secondary" size="sm">
                Back to projects
              </Button>
            )
          }
          className="mt-10 py-16"
        />
      </DashboardLayout>
    );
  }

  if (!project || !blueprint) {
    return (
      <DashboardLayout>
        <EmptyState
          tone="error"
          title="No blueprint was generated"
          description="Nothing has been generated for this project yet."
          action={
            <Button type="button" variant="secondary" size="sm" onClick={() => load('initial')}>
              Generate blueprint
            </Button>
          }
          className="mt-10 py-16"
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-7 pb-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[12px] text-ink-faint">
            <Link href="/dashboard/projects" className="shrink-0 transition-colors hover:text-ink">
              Projects
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
            <Link
              href={`/projects/${project.slug || project._id}`}
              className="max-w-[180px] truncate transition-colors hover:text-ink"
            >
              {project.title}
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="shrink-0 text-ink-soft">Blueprint</span>
          </nav>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => load('regenerate')}
            disabled={regenerating}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', regenerating && 'animate-spin')} aria-hidden="true" />
            {regenerating ? 'Regenerating…' : 'Regenerate'}
          </Button>
        </div>

        <Card tone="strong" className="p-6 sm:p-8">
          <Badge tone="sage">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            {savedMeta?.saved ? 'Saved AI blueprint' : 'AI architect plan'}
          </Badge>

          {savedMeta?.generatedAt ? (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
              Saved {new Date(savedMeta.generatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
              {savedMeta.model ? ` · ${savedMeta.model}` : ''}
            </p>
          ) : null}

          <h1 className="mt-4 max-w-[30ch] font-serif text-[clamp(1.8rem,3.6vw,2.5rem)] leading-[1.1] tracking-[-0.03em] text-ink">
            {project.title} — blueprint
          </h1>
          <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-ink-muted">
            A step-by-step roadmap for implementing this project. Tick tasks off as you complete them to
            track real build progress.
          </p>

          <div className="mt-6 border-t border-ink/10 pt-5">
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                Implementation progress
              </span>
              <span className="font-mono text-[11px] text-forest">
                {progressPercent}% · {completedCount}/{totalTasks}
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Implementation progress"
              className="mt-2.5 h-[5px] overflow-hidden rounded-full bg-ink/10"
            >
              <div
                className="h-full rounded-full bg-forest transition-[width] duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </Card>

        {blueprint.architecture ? (
          <Card className="p-6 sm:p-7">
            <h2 className="flex items-center gap-2 font-serif text-[19px] tracking-[-0.01em] text-ink">
              <Layers className="h-4 w-4 text-forest" aria-hidden="true" />
              System architecture
            </h2>
            <p className="mt-3 rounded-control border border-ink/10 bg-ivory-warm/50 p-4 text-[13px] leading-relaxed text-ink-soft">
              {blueprint.architecture}
            </p>
          </Card>
        ) : null}

        <section aria-labelledby="phases" className="space-y-4">
          <h2
            id="phases"
            className="flex items-center gap-2 font-serif text-[20px] tracking-[-0.015em] text-ink"
          >
            <Award className="h-4 w-4 text-forest" aria-hidden="true" />
            Implementation phases
          </h2>

          <div className="space-y-4">
            {blueprint.steps.map((step, stepIndex) => (
              <Card key={step.phase} className="p-5 sm:p-6">
                <h3 className="flex items-center gap-3 font-serif text-[17px] leading-snug text-ink">
                  <span className="flex h-6 w-6 items-center justify-center rounded-[6px] border border-forest/25 bg-forest/[0.07] font-mono text-[10.5px] text-forest">
                    {String(stepIndex + 1).padStart(2, '0')}
                  </span>
                  {step.phase}
                </h3>

                {step.learningObjectives?.length ? (
                  <div className="mt-4 rounded-control border border-forest/15 bg-forest/[0.04] p-3">
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-forest">
                      Learning objectives
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {step.learningObjectives.map((objective) => (
                        <li
                          key={objective}
                          className="flex items-start gap-2 text-[12px] leading-relaxed text-ink-soft"
                        >
                          <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-forest/70" />
                          {objective}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <ul className="mt-4 space-y-2">
                  {step.tasks.map((task, taskIndex) => {
                    const taskKey = `${stepIndex}-${taskIndex}`;
                    const isChecked = !!completedTasks[taskKey];

                    return (
                      <li key={taskKey}>
                        <button
                          type="button"
                          onClick={() => toggleTask(taskKey)}
                          aria-pressed={isChecked}
                          className={cn(
                            'flex w-full items-start gap-3 rounded-control border p-3 text-left transition-colors duration-150',
                            isChecked
                              ? 'border-forest/25 bg-forest/[0.05]'
                              : 'border-ink/10 bg-ivory-warm/45 hover:border-ink/25 hover:bg-ivory-warm/75'
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border',
                              isChecked
                                ? 'border-forest bg-forest text-ivory-warm'
                                : 'border-ink/30 bg-transparent'
                            )}
                          >
                            {isChecked ? <Check className="h-3 w-3" /> : null}
                          </span>
                          <span
                            className={cn(
                              'text-[12.5px] leading-relaxed',
                              isChecked ? 'text-ink-faint line-through' : 'text-ink-soft'
                            )}
                          >
                            {task}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {step.deliverables?.length ? (
                  <div className="mt-4 border-t border-ink/10 pt-3">
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-faint">
                      Deliverables
                    </p>
                    <ul className="mt-1.5 flex flex-wrap gap-1.5">
                      {step.deliverables.map((deliverable) => (
                        <li
                          key={deliverable}
                          className="rounded-full border border-ink/10 bg-ivory-warm/60 px-2.5 py-1 text-[11px] text-ink-soft"
                        >
                          {deliverable}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        </section>

        {blueprint.bestPractices.length > 0 ? (
          <Card className="p-6">
            <h2 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Engineering best practices
            </h2>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {blueprint.bestPractices.map((practice) => (
                <li
                  key={practice}
                  className="flex items-start gap-2.5 rounded-control border border-ink/10 bg-ivory-warm/50 p-3"
                >
                  <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-forest/70" />
                  <span className="text-[12px] leading-relaxed text-ink-soft">{practice}</span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

function Spinner() {
  return (
    <span
      role="status"
      aria-label="Generating blueprint"
      className="h-9 w-9 animate-spin rounded-full border-2 border-forest/25 border-t-forest"
    />
  );
}
