'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Layers } from 'lucide-react';
import ProjectCard, { ProjectData } from '../../../../components/ProjectCard';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { apiFetchRaw } from '@/lib/api';

export default function DomainProjectsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDomainProjects = async () => {
      setLoading(true);
      try {
        const res = await apiFetchRaw(`/domains/${slug}/projects`);
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects ?? []);
        }
      } catch (error) {
        console.error('Failed to fetch domain projects', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchDomainProjects();
    }
  }, [slug]);

  const domainFormatted = slug
    ? slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    : 'Domain';

  return (
    <DashboardLayout>
      <div className="space-y-7">
        <Link
          href={`/domains/${slug}`}
          className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-faint transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to {domainFormatted}
        </Link>

        <PageHeader
          eyebrow="Domain projects"
          title={`${domainFormatted} capstone projects`}
          description={`Hands-on blueprints that build industry competencies in ${domainFormatted}.`}
          actions={<Badge tone="sage">{projects.length} available</Badge>}
        />

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-72 animate-pulse rounded-card bg-ink/[0.06]" />
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Layers}
            title="No projects yet for this domain"
            description="New capstone blueprints are added here as they are published."
            action={
              <Button href="/dashboard/projects" variant="secondary" size="sm">
                Browse the full catalogue
              </Button>
            }
          />
        )}
      </div>
    </DashboardLayout>
  );
}
