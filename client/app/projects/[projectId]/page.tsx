'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Award, CheckCircle2, ChevronRight, Clock2, Code2, ShieldCheck, Target } from 'lucide-react';
import { ProjectData } from '../../../components/ProjectCard';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StarButton } from '@/components/ui/StarButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { apiFetchRaw } from '@/lib/api';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjectDetails = async () => {
      setLoading(true);
      try {
        const res = await apiFetchRaw(`/projects/${projectId}`);

        if (!res.ok) {
          throw new Error('Project not found or failed to load');
        }

        const data = await res.json();
        setProject(data.project);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An error occurred while loading project');
        }
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-4 w-40 animate-pulse rounded bg-ink/10" />
          <div className="h-52 animate-pulse rounded-card bg-ink/[0.06]" />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="h-56 animate-pulse rounded-card bg-ink/[0.06] lg:col-span-2" />
            <div className="h-56 animate-pulse rounded-card bg-ink/[0.06]" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout>
        <EmptyState
          title="Project not found"
          description={error || 'The requested project blueprint could not be found.'}
          action={
            <Button href="/dashboard/projects" variant="secondary" size="sm">
              Return to project library
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
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] text-ink-faint">
          <Link href="/dashboard/projects" className="transition-colors hover:text-ink">
            Projects
          </Link>
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
          <span className="truncate text-ink-soft">{project.title}</span>
        </nav>

        {/* Hero */}
        <Card tone="strong" className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="sage">{project.difficulty}</Badge>
            <Badge tone="outline">
              <Clock2 className="h-3 w-3" aria-hidden="true" />
              {project.estimatedTime}
            </Badge>
            <Badge tone="outline">{project.category}</Badge>
          </div>

          <h1 className="mt-5 max-w-[26ch] font-serif text-[clamp(1.9rem,4.2vw,2.9rem)] leading-[1.08] tracking-[-0.03em] text-ink">
            {project.title}
          </h1>
          <p className="mt-3 max-w-3xl text-[14.5px] leading-relaxed text-ink-muted">{project.description}</p>

          <div className="mt-7 flex flex-col gap-3 border-t border-ink/10 pt-6 sm:flex-row">
            <StarButton onClick={() => router.push(`/projects/${project.slug || project._id}/blueprint`)}>
              Launch architecture blueprint
            </StarButton>
            <Button
              onClick={() => router.push(`/projects/${project.slug || project._id}/workspace`)}
              variant="secondary"
              size="lg"
            >
              <Code2 className="h-4 w-4" aria-hidden="true" />
              Open workspace
            </Button>
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card className="p-6">
              <h2 className="flex items-center gap-2 font-serif text-[19px] tracking-[-0.01em] text-ink">
                <Target className="h-4 w-4 text-forest" aria-hidden="true" />
                Problem statement
              </h2>
              <p className="mt-3 text-[13.5px] leading-relaxed text-ink-muted">
                {project.problemStatement ||
                  'This project simulates an engineering challenge that requires system modelling, modern interface patterns and production deployment standards.'}
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="flex items-center gap-2 font-serif text-[19px] tracking-[-0.01em] text-ink">
                <Award className="h-4 w-4 text-forest" aria-hidden="true" />
                Competencies you will acquire
              </h2>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {project.skills.map((skill) => (
                  <div
                    key={skill}
                    className="flex items-start gap-2.5 rounded-control border border-ink/10 bg-ivory-warm/50 px-3.5 py-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest/70" aria-hidden="true" />
                    <span className="text-[12.5px] leading-snug text-ink-soft">{skill}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            <Card className="p-6">
              <h2 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
                Technologies
              </h2>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {project.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-ink/12 bg-ivory-warm/60 px-2.5 py-1 font-mono text-[10.5px] text-ink-soft"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Prerequisites
              </h2>
              {project.prerequisites && project.prerequisites.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {project.prerequisites.map((prerequisite) => (
                    <li key={prerequisite} className="flex items-center gap-2 text-[12.5px] text-ink-soft">
                      <span aria-hidden="true" className="h-1 w-1 rounded-full bg-forest/70" />
                      {prerequisite}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[12.5px] leading-relaxed text-ink-faint">
                  No prerequisites — start at the beginning of the blueprint.
                </p>
              )}
            </Card>

            {project.tags.length > 0 ? (
              <Card className="p-6">
                <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  Tagged topics
                </h2>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <Badge key={tag} tone="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
