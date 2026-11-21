'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, ApiError } from '@/lib/api';
import {
  Activity,
  ArrowRight,
  Award,
  Bot,
  Compass,
  Flame,
  FolderGit2,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

interface Badge {
  id: string;
  name: string;
  description: string;
}

interface Stats {
  xp: number;
  level: number;
  streak: number;
  xpForNextLevel: number;
  xpProgressInLevel: number;
  badges: Badge[];
  skills: Array<{ name: string; score: number }>;
}

interface ProjectSummary {
  _id: string;
  title: string;
  difficulty: string;
  estimatedTime?: string;
  description: string;
  tags: string[];
}

export default function DashboardPage() {
  const { user } = useAuth();

  const [stats, setStats] = useState<Stats | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    const [statsResult, projectsResult] = await Promise.allSettled([
      apiFetch<{ stats: Stats }>('/gamification/stats'),
      apiFetch<{ projects: ProjectSummary[] }>('/projects?sort=recommended'),
    ]);

    if (statsResult.status === 'fulfilled') {
      setStats(statsResult.value.stats);
    } else {
      const reason = statsResult.reason;
      setError(
        reason instanceof ApiError ? reason.message : 'Could not load your progress. Please try again.',
      );
    }

    if (projectsResult.status === 'fulfilled') {
      setProjects(projectsResult.value.projects ?? []);
    } else {
      setProjects([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const progressPercent =
    stats && stats.xpForNextLevel > 0
      ? Math.min(100, Math.round((stats.xpProgressInLevel / stats.xpForNextLevel) * 100))
      : 0;

  const totals = [
    { label: 'Total XP', value: stats?.xp ?? 0, icon: TrendingUp },
    { label: 'Level', value: stats?.level ?? 1, icon: Award },
    { label: 'Day streak', value: stats?.streak ?? 0, icon: Flame },
    { label: 'Badges', value: stats?.badges.length ?? 0, icon: Sparkles },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-7">
        <PageHeader
          eyebrow="Overview"
          title={`Welcome back, ${user?.fullName?.split(' ')[0] || 'Engineer'}`}
          description={`${user?.experienceLevel || 'Level not set'} · ${user?.college || 'College not set'}`}
          actions={
            <Button href="/dashboard/projects" variant="secondary">
              <FolderGit2 className="h-4 w-4" aria-hidden="true" />
              Project library
            </Button>
          }
        />

        {error ? (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-card border border-[var(--color-danger)]/30 bg-[var(--color-danger-tint)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-[13px] text-[var(--color-danger)]">{error}</p>
            <Button type="button" variant="secondary" size="sm" onClick={load}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Retry
            </Button>
          </div>
        ) : null}

        {/* Progress summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {totals.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                    {item.label}
                  </span>
                  <Icon className="h-4 w-4 text-forest/70" aria-hidden="true" />
                </div>
                <p className="mt-3 font-serif text-[30px] leading-none tracking-[-0.02em] text-ink">
                  {loading ? <span className="inline-block h-7 w-10 animate-pulse rounded bg-ink/10" /> : item.value}
                </p>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Skills */}
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-serif text-[19px] tracking-[-0.01em] text-ink">
                <Activity className="h-4 w-4 text-forest" aria-hidden="true" />
                Verified skill scores
              </h2>
              <Badge tone="outline">Verified only</Badge>
            </div>

            <div className="mt-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((row) => (
                    <div key={row} className="h-8 animate-pulse rounded bg-ink/[0.07]" />
                  ))}
                </div>
              ) : stats && stats.skills.length > 0 ? (
                <ul className="space-y-4">
                  {stats.skills.map((skill) => (
                    <li key={skill.name}>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="truncate text-[13px] text-ink-soft">{skill.name}</span>
                        <span className="font-mono text-[11.5px] text-forest">{skill.score}%</span>
                      </div>
                      <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-ink/10">
                        <div
                          className="h-full rounded-full bg-forest/75"
                          style={{ width: `${Math.max(0, Math.min(100, skill.score))}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={Activity}
                  title="No verified skills yet"
                  description="Scores appear here once your submitted work has been reviewed and verified."
                  className="py-10"
                />
              )}
            </div>
          </Card>

          {/* Mentor + level */}
          <div className="space-y-5">
            <Card tone="sunken" className="p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-forest/25 bg-forest/[0.07] text-forest">
                <Bot className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-serif text-[18px] leading-snug text-ink">AI mentor</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
                Ask about a bug, a design trade-off or a concept you are stuck on.
              </p>
              <Button href="/dashboard/projects" variant="secondary" size="sm" fullWidth className="mt-5">
                Pick a project
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </Card>

            <Card className="p-6">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  Level {stats?.level ?? 1}
                </span>
                <span className="font-mono text-[11px] text-forest">{stats?.xp ?? 0} XP</span>
              </div>
              <div className="mt-3 h-[5px] overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full rounded-full bg-forest transition-[width] duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="mt-3 text-[11.5px] leading-relaxed text-ink-faint">
                {stats && stats.xp > 0
                  ? `${stats.xpProgressInLevel} / ${stats.xpForNextLevel} XP to the next level`
                  : 'No XP earned yet — complete a verified task to begin.'}
              </p>
            </Card>
          </div>
        </div>

        {/* Recommended projects */}
        <section aria-labelledby="recommended-projects" className="space-y-4">
          <div className="flex items-end justify-between">
            <h2
              id="recommended-projects"
              className="font-serif text-[21px] tracking-[-0.015em] text-ink"
            >
              Recommended for you
            </h2>
            <Link
              href="/dashboard/projects"
              className="text-[12.5px] text-forest underline-offset-4 transition-colors hover:text-forest-deep hover:underline"
            >
              View all
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2].map((row) => (
                <div key={row} className="h-44 animate-pulse rounded-card bg-ink/[0.06]" />
              ))}
            </div>
          ) : projects.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {projects.slice(0, 2).map((project) => (
                <Card key={project._id} interactive className="flex flex-col p-5">
                  <div className="flex items-center justify-between">
                    <Badge tone="outline">{project.difficulty}</Badge>
                    {project.estimatedTime ? (
                      <span className="font-mono text-[10.5px] text-ink-faint">{project.estimatedTime}</span>
                    ) : null}
                  </div>
                  <h3 className="mt-4 font-serif text-[18px] leading-snug tracking-[-0.01em] text-ink">
                    {project.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-[12.5px] leading-relaxed text-ink-muted">
                    {project.description}
                  </p>
                  {(project.tags ?? []).length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {project.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-ink/10 px-2 py-0.5 font-mono text-[10px] text-ink-faint"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <Link
                    href={`/projects/${project._id}`}
                    className="mt-5 flex items-center justify-between border-t border-ink/10 pt-3 text-[12.5px] font-medium text-forest transition-colors hover:text-forest-deep"
                  >
                    Open project
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FolderGit2}
              title="No projects available yet"
              description="The catalogue is empty right now. Browse domains to see what is published."
              action={
                <Button href="/dashboard/domains" variant="secondary" size="sm">
                  <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                  Browse domains
                </Button>
              }
            />
          )}
        </section>

        <Card className="p-6">
          <h2 className="flex items-center gap-2 font-serif text-[19px] tracking-[-0.01em] text-ink">
            <TrendingUp className="h-4 w-4 text-forest" aria-hidden="true" />
            Recent activity
          </h2>
          <div className="mt-5">
            <EmptyState
              title="No activity recorded yet"
              description="Verified tasks and XP awards appear here as soon as they happen."
              className="py-10"
            />
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
