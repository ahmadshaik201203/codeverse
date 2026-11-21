'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { DomainData } from '@/components/DomainCard';
import DashboardLayout from '@/components/DashboardLayout';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Brain,
  CheckCircle2,
  FolderGit2,
  Wrench,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function DomainDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [domain, setDomain] = useState<DomainData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    apiFetch(`/domains/${slug}`)
      .then((res) => {
        if (res.domain) setDomain(res.domain);
      })
      .catch(() => {
        // Fallback representation if backend is in cold start
        setDomain({
          name: slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          slug: slug,
          description:
            'Deep dive into modern engineering principles, production system design, and industry-standard workflows for this domain.',
          category: 'Development',
          skills: ['Architecture & Design', 'API Protocols', 'Data Modeling', 'Performance Optimization'],
          technologies: ['TypeScript', 'Node.js', 'Next.js', 'MongoDB', 'Docker'],
          difficulty: 'Intermediate',
          careerRoles: ['Software Engineer', 'Full Stack Developer', 'System Architect'],
        });
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-4 w-32 animate-pulse rounded bg-ink/10" />
          <div className="h-40 animate-pulse rounded-card bg-ink/[0.06]" />
          <div className="grid gap-4 lg:grid-cols-3">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-48 animate-pulse rounded-card bg-ink/[0.06]" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!domain) {
    return (
      <DashboardLayout>
        <EmptyState
          icon={Brain}
          title="Domain not found"
          description="This domain may have been renamed or is not published yet."
          action={
            <Button href="/dashboard/domains" variant="secondary" size="sm">
              Back to domains
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
        <Link
          href="/dashboard/domains"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-faint transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to domains
        </Link>

        {/* Header */}
        <Card tone="strong" className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="sage">{domain.category} track</Badge>
            <Badge tone="outline">{domain.difficulty}</Badge>
          </div>
          <h1 className="mt-5 font-serif text-[clamp(1.9rem,4vw,2.7rem)] leading-[1.1] tracking-[-0.03em] text-ink">
            {domain.name}
          </h1>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-ink-muted">{domain.description}</p>

          <div className="mt-7 flex flex-col gap-3 border-t border-ink/10 pt-6 sm:flex-row">
            <Button href={`/domains/${domain.slug}/projects`}>
              <FolderGit2 className="h-4 w-4" aria-hidden="true" />
              Browse domain projects
            </Button>
            <Button href="/dashboard/projects" variant="secondary">
              Explore full catalogue
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </Card>

        {/* Detail grid */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-forest/25 bg-forest/[0.06] text-forest">
                <Brain className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-serif text-[17px] leading-tight text-ink">Required skills</h2>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-faint">
                  Core competencies
                </p>
              </div>
            </div>
            <ul className="mt-5 space-y-3 border-t border-ink/10 pt-4">
              {domain.skills.map((skill) => (
                <li key={skill} className="flex items-start gap-2.5 text-[13px] leading-snug text-ink-soft">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest/70" aria-hidden="true" />
                  {skill}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-forest/25 bg-forest/[0.06] text-forest">
                <Wrench className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-serif text-[17px] leading-tight text-ink">Technologies</h2>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-faint">
                  Industry standard
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-1.5 border-t border-ink/10 pt-4">
              {domain.technologies.map((tech) => (
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
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-forest/25 bg-forest/[0.06] text-forest">
                <Award className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-serif text-[17px] leading-tight text-ink">Target roles</h2>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-faint">
                  Hiring titles
                </p>
              </div>
            </div>
            <ul className="mt-5 space-y-3 border-t border-ink/10 pt-4">
              {domain.careerRoles.map((role) => (
                <li key={role} className="flex items-center gap-2.5 text-[13px] text-ink-soft">
                  <span aria-hidden="true" className="h-1 w-1 rounded-full bg-forest/70" />
                  {role}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card tone="quiet" className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-[18px] tracking-[-0.01em] text-ink">Ready to build?</h2>
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-ink-muted">
              Projects for this domain carry their own blueprint, milestones and review checkpoints.
            </p>
          </div>
          <Button href={`/domains/${domain.slug}/projects`} variant="secondary" size="sm">
            Open project list
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </Card>
      </div>
    </DashboardLayout>
  );
}
