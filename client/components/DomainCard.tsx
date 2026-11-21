'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, BarChart3, Brain, Cloud, Code2 } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

export interface DomainData {
  _id?: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  icon?: string;
  skills: string[];
  technologies: string[];
  difficulty: string;
  careerRoles: string[];
}

interface DomainCardProps {
  domain: DomainData;
}

const categoryIcon = (category: string) => {
  switch (category) {
    case 'AI':
      return Brain;
    case 'Data':
      return BarChart3;
    case 'Development':
      return Code2;
    default:
      return Cloud;
  }
};

export default function DomainCard({ domain }: DomainCardProps) {
  const Icon = categoryIcon(domain.category);

  return (
    <Link href={`/domains/${domain.slug}`} className="group block h-full">
      <Card interactive className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-forest/25 bg-forest/[0.06] text-forest">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <Badge tone="outline">{domain.difficulty}</Badge>
        </div>

        <h3 className="mt-4 font-serif text-[18px] leading-snug tracking-[-0.01em] text-ink">
          {domain.name}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink-muted">
          {domain.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {domain.technologies.slice(0, 3).map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-ink/10 px-2 py-0.5 font-mono text-[10px] text-ink-faint"
            >
              {tech}
            </span>
          ))}
          {domain.technologies.length > 3 ? (
            <span className="px-1 py-0.5 font-mono text-[10px] text-ink-faint">
              +{domain.technologies.length - 3}
            </span>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-3 text-[12.5px] font-medium text-forest">
          <span>Open blueprint</span>
          <ArrowUpRight
            className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </div>
      </Card>
    </Link>
  );
}
