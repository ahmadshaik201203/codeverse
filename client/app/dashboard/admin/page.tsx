'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, ApiError } from '@/lib/api';
import { FileCode, ShieldAlert, ShieldCheck } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

interface AdminProject {
  _id: string;
  title: string;
  description: string;
  domainSlug: string;
  difficulty: string;
}

interface Overview {
  users: number;
  domains: number;
  projects: number;
  posts: number;
}

export default function AdminPortalPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        // This endpoint is role-gated server-side; a 403 here is the real answer.
        const [overviewRes, projectsRes] = await Promise.all([
          apiFetch<{ overview: Overview }>('/admin/overview'),
          apiFetch<{ projects: AdminProject[] }>('/projects'),
        ]);
        setOverview(overviewRes.overview);
        setProjects(projectsRes.projects ?? []);
      } catch (err: unknown) {
        if (err instanceof ApiError && (err.status === 403 || err.status === 401)) {
          setDenied(true);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load admin data.');
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  if (denied) {
    return (
      <DashboardLayout>
        <EmptyState
          tone="error"
          icon={ShieldAlert}
          title="Administrator access required"
          description="Your account does not hold the faculty or administrator role. This area is restricted on the server, not only hidden in the interface."
          action={
            <Button href="/dashboard" variant="secondary" size="sm">
              Return to dashboard
            </Button>
          }
          className="mt-10 py-16"
        />
      </DashboardLayout>
    );
  }

  const metrics = [
    { label: 'Registered users', value: overview?.users ?? 0 },
    { label: 'Domains', value: overview?.domains ?? 0 },
    { label: 'Projects', value: overview?.projects ?? 0 },
    { label: 'Community posts', value: overview?.posts ?? 0 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-7">
        <PageHeader
          eyebrow="Administration"
          title="Platform overview"
          description="Live counts read directly from the database — no estimated or illustrative figures."
          actions={<Badge tone="sage">Restricted</Badge>}
        />

        {error ? (
          <div
            role="alert"
            className="rounded-card border border-[var(--color-danger)]/30 bg-[var(--color-danger-tint)] px-4 py-3 text-[13px] text-[var(--color-danger)]"
          >
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                {metric.label}
              </p>
              <p className="mt-3 font-serif text-[28px] leading-none tracking-[-0.02em] text-ink">
                {loading ? (
                  <span className="inline-block h-6 w-10 animate-pulse rounded bg-ink/10" />
                ) : (
                  metric.value
                )}
              </p>
            </Card>
          ))}
        </div>

        <section aria-labelledby="admin-projects" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2
              id="admin-projects"
              className="flex items-center gap-2 font-serif text-[20px] tracking-[-0.015em] text-ink"
            >
              <FileCode className="h-4 w-4 text-forest" aria-hidden="true" />
              Engineering projects
            </h2>
            <p className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Signed in as {user?.role || 'member'}
            </p>
          </div>

          <Card className="overflow-hidden">
            <div className="hidden grid-cols-[1fr_auto] gap-4 border-b border-ink/10 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint sm:grid">
              <span>Project</span>
              <span>Domain / difficulty</span>
            </div>

            {loading ? (
              <div className="space-y-2 p-5">
                {[1, 2, 3].map((row) => (
                  <div key={row} className="h-12 animate-pulse rounded bg-ink/[0.06]" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <p className="px-5 py-8 text-[13px] text-ink-muted">
                No projects found. Seed the catalogue to see entries here.
              </p>
            ) : (
              <ul className="divide-y divide-ink/10">
                {projects.map((project) => (
                  <li
                    key={project._id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-medium text-ink">{project.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-ink-muted">
                        {project.description}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone="outline">{project.domainSlug}</Badge>
                      <Badge tone="sage">{project.difficulty}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
}
