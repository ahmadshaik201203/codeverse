'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, BarChart3, Brain, Cloud, Code2 } from 'lucide-react';
import { Container } from './ui/Container';
import { SectionHeading } from './ui/SectionHeading';
import { Reveal } from './ui/Reveal';
import { cn } from '@/lib/cn';

interface Domain {
  name: string;
  slug: string;
  description: string;
}

interface DomainCategory {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  domains: Domain[];
}

const domainCategories: DomainCategory[] = [
  {
    id: 'ai',
    label: 'AI & intelligence',
    icon: Brain,
    domains: [
      { name: 'Artificial Intelligence', slug: 'artificial-intelligence', description: 'Intelligent systems & autonomous reasoning' },
      { name: 'Machine Learning', slug: 'machine-learning', description: 'Statistical learning & predictive models' },
      { name: 'Deep Learning', slug: 'deep-learning', description: 'Neural networks & representation learning' },
      { name: 'Generative AI', slug: 'generative-ai', description: 'Content synthesis & creative AI models' },
      { name: 'LLMs', slug: 'llms', description: 'Large language models & foundation systems' },
      { name: 'NLP', slug: 'nlp', description: 'Text analysis, understanding & generation' },
      { name: 'Computer Vision', slug: 'computer-vision', description: 'Image & video perception systems' },
      { name: 'Voice AI', slug: 'voice-ai', description: 'Speech recognition & voice interfaces' },
      { name: 'Reinforcement Learning', slug: 'reinforcement-learning', description: 'Decision-making through reward optimisation' },
      { name: 'AI Agents', slug: 'ai-agents', description: 'Autonomous tool-using AI systems' },
      { name: 'Robotics', slug: 'robotics', description: 'Physical AI control & automation' },
    ],
  },
  {
    id: 'data',
    label: 'Data & analytics',
    icon: BarChart3,
    domains: [
      { name: 'Data Science', slug: 'data-science', description: 'Insights from structured & unstructured data' },
      { name: 'Data Analytics', slug: 'data-analytics', description: 'Exploratory analysis & dashboards' },
      { name: 'Business Intelligence', slug: 'business-intelligence', description: 'KPI reporting & executive decision support' },
      { name: 'Data Engineering', slug: 'data-engineering', description: 'Pipelines, ETL, and warehouse architecture' },
      { name: 'Big Data', slug: 'big-data', description: 'Distributed processing at scale' },
    ],
  },
  {
    id: 'development',
    label: 'Software development',
    icon: Code2,
    domains: [
      { name: 'Full Stack Development', slug: 'full-stack-development', description: 'End-to-end web application engineering' },
      { name: 'Mobile App Development', slug: 'mobile-app-development', description: 'iOS, Android & cross-platform apps' },
      { name: 'Desktop Development', slug: 'desktop-development', description: 'Native desktop application architecture' },
    ],
  },
  {
    id: 'infrastructure',
    label: 'Coming soon',
    icon: Cloud,
    domains: [
      { name: 'Cloud Computing', slug: 'cloud-computing', description: 'AWS, Azure, GCP infrastructure' },
      { name: 'DevOps & SRE', slug: 'devops', description: 'CI/CD, containers & reliability' },
      { name: 'Cybersecurity', slug: 'cybersecurity', description: 'Application & network security' },
      { name: 'Blockchain', slug: 'blockchain', description: 'Decentralized apps & smart contracts' },
    ],
  },
];

export default function Domains() {
  const [activeTab, setActiveTab] = useState('ai');
  const activeCategory = domainCategories.find((category) => category.id === activeTab)!;
  const comingSoon = activeCategory.id === 'infrastructure';

  return (
    <section id="domains" className="border-t border-ink/10 py-20 sm:py-28">
      <Container size="wide">
        <Reveal>
          <SectionHeading
            eyebrow="Explore domains"
            title={
              <>
                18+ specialised industry
                <br className="hidden sm:block" /> domains.
              </>
            }
            description="Every domain carries curated projects, a technology stack, datasets and career pathways mapped to real industry roles."
          />
        </Reveal>

        <div
          className="mt-10 -mx-1 flex gap-1 overflow-x-auto pb-px no-scrollbar"
          role="tablist"
          aria-label="Domain categories"
        >
          {domainCategories.map((category) => {
            const Icon = category.icon;
            const active = activeTab === category.id;
            return (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls="domain-grid"
                onClick={() => setActiveTab(category.id)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-xs transition-colors duration-200',
                  active
                    ? 'border-forest text-ink'
                    : 'border-transparent text-ink-faint hover:border-ink/20 hover:text-ink-soft',
                )}
              >
                <Icon className={cn('h-4 w-4', active ? 'text-forest' : 'text-ink-faint')} />
                {category.label}
              </button>
            );
          })}
        </div>

        <div
          id="domain-grid"
          role="tabpanel"
          className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-card border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-3"
        >
          {activeCategory.domains.map((domain, index) => (
            <Link
              key={domain.slug}
              href={`/domains/${domain.slug}`}
              className="group flex min-h-[118px] flex-col justify-between gap-4 bg-ivory-warm/75 p-4 transition-colors duration-200 hover:bg-ivory-warm/95 focus-visible:bg-ivory-warm"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-serif text-base leading-snug tracking-[-0.01em] text-ink">
                    {domain.name}
                  </h3>
                  <ArrowUpRight
                    className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-forest"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-1 text-pretty text-sm leading-relaxed text-ink-muted">{domain.description}</p>
              </div>
              <span className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">
                <span>{String(index + 1).padStart(2, '0')}</span>
                {comingSoon ? <span className="text-forest">Launching soon</span> : <span>Blueprint</span>}
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
