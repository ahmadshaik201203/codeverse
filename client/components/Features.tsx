'use client';

import React from 'react';
import {
  Activity,
  Bot,
  Briefcase,
  Code,
  Database,
  FileText,
  Lightbulb,
  Map,
  Mic2,
  Network,
} from 'lucide-react';
import { Container } from './ui/Container';
import { SectionHeading } from './ui/SectionHeading';
import { Reveal } from './ui/Reveal';

const features = [
  {
    title: 'AI project roadmaps',
    description: 'Milestone plans calibrated to the level you are actually at.',
    icon: Map,
  },
  {
    title: 'Technology selection',
    description: 'Industry-standard frameworks, with the reasoning behind each choice.',
    icon: Lightbulb,
  },
  {
    title: 'Dataset intelligence',
    description: 'Verified datasets for ML work, including preprocessing notes.',
    icon: Database,
  },
  {
    title: 'Architecture guidance',
    description: 'Schema, entity relationships and API design before you write code.',
    icon: Network,
  },
  {
    title: 'Interactive AI mentor',
    description: 'Context-aware help with debugging, concepts and next steps.',
    icon: Bot,
  },
  {
    title: 'Automated code review',
    description: 'Syntax, complexity, security and practice checks in the coding lab.',
    icon: Code,
  },
  {
    title: 'Skill gap analysis',
    description: 'Weak spots across your stack, with targeted practice recommendations.',
    icon: Activity,
  },
  {
    title: 'AI mock interviews',
    description: 'Technical, behavioural and system design rounds with honest feedback.',
    icon: Mic2,
  },
  {
    title: 'ATS resume analysis',
    description: 'Compare your resume against real job descriptions and missing keywords.',
    icon: FileText,
  },
  {
    title: 'Portfolio generator',
    description: 'Export case studies, README files and a shareable summary of your work.',
    icon: Briefcase,
  },
];

export default function Features() {
  return (
    <section id="features" className="border-t border-ink/10 py-20 sm:py-28">
      <Container size="wide">
        <Reveal>
          <SectionHeading
            eyebrow="Capabilities"
            title={
              <>
                Ten tools, one continuous
                <br className="hidden sm:block" /> working environment.
              </>
            }
            description="Each capability exists to remove a specific kind of friction between learning something and shipping it."
          />
        </Reveal>

        <div className="mt-12 grid gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.title} delay={index * 0.02}>
                <div className="group flex h-full gap-4 border-t border-ink/10 py-6">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink/12 text-forest transition-colors duration-200 group-hover:border-forest/40 group-hover:bg-forest/[0.06]">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-base font-medium tracking-[-0.005em] text-ink">{feature.title}</h3>
                    <p className="mt-1 text-pretty text-sm leading-relaxed text-ink-muted">{feature.description}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
