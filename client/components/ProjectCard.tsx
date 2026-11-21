'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock2 } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

export interface ProjectData {
  _id?: string;
  title: string;
  slug: string;
  domainSlug?: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  problemStatement?: string;
  estimatedTime: string;
  skills: string[];
  technologies: string[];
  tags: string[];
  thumbnail?: string;
  featured?: boolean;
  prerequisites?: string[];
  popularity?: number;
}

interface ProjectCardProps {
  project: ProjectData;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card interactive className="flex h-full flex-col p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="outline">{project.difficulty}</Badge>
          {project.featured ? <Badge tone="forest">Featured</Badge> : null}
        </div>
        {project.estimatedTime ? (
          <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10.5px] text-ink-faint">
            <Clock2 className="h-3 w-3" aria-hidden="true" />
            {project.estimatedTime}
          </span>
        ) : null}
      </div>

      <h3 className="mt-4 font-serif text-[18px] leading-snug tracking-[-0.01em] text-ink">
        {project.title}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink-muted">
        {project.description}
      </p>

      <div className="mt-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">Stack</span>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {project.technologies.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-ink/10 px-2 py-0.5 font-mono text-[10px] text-ink-faint"
            >
              {tech}
            </span>
          ))}
          {project.technologies.length > 4 ? (
            <span className="px-1 py-0.5 font-mono text-[10px] text-ink-faint">
              +{project.technologies.length - 4}
            </span>
          ) : null}
        </div>
      </div>

      {project.skills.length > 0 ? (
        <ul className="mt-4 space-y-1">
          {project.skills.slice(0, 2).map((skill) => (
            <li key={skill} className="flex items-center gap-1.5 text-[12px] text-ink-soft">
              <CheckCircle2 className="h-3 w-3 shrink-0 text-forest/70" aria-hidden="true" />
              <span className="truncate">{skill}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <Link
        href={`/projects/${project.slug || project._id}`}
        className="mt-auto flex items-center justify-between border-t border-ink/10 pt-3.5 text-[12.5px] font-medium text-forest transition-colors hover:text-forest-deep"
      >
        View blueprint
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </Card>
  );
}
