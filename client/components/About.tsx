'use client';

import React from 'react';
import { Compass, Database, Layers, Minus, UserCheck } from 'lucide-react';
import { Container } from './ui/Container';
import { SectionHeading } from './ui/SectionHeading';
import { Card } from './ui/Card';
import { Reveal } from './ui/Reveal';

const problems = [
  'Choosing a clear career path among fast-moving trends',
  'Selecting projects that actually impress hiring managers',
  'Understanding real-world software and system architecture',
  'Choosing modern, industry-standard technologies',
  'Finding quality datasets and authentic resources',
  'Structuring the end-to-end development cycle',
  'Preparing for technical and behavioural interviews',
];

const solutions = [
  {
    icon: Compass,
    title: 'Career & domain alignment',
    description: 'Guidance that matches your interests to high-growth engineering domains.',
  },
  {
    icon: Layers,
    title: 'Dynamic AI blueprints',
    description: 'Architecture, ER diagrams, API design and a milestone-by-milestone roadmap.',
  },
  {
    icon: Database,
    title: 'Curated resources',
    description: 'Vetted datasets, libraries and a rationale for every technology choice.',
  },
  {
    icon: UserCheck,
    title: 'Mentor & mock interviews',
    description: 'A pair programmer for debugging, reviews and realistic interview rounds.',
  },
];

export default function About() {
  return (
    <section id="about" className="border-t border-ink/10 py-20 sm:py-28">
      <Container size="wide">
        <Reveal>
          <SectionHeading
            eyebrow="About CodeVerse"
            title={
              <>
                The distance between a syllabus
                <br className="hidden sm:block" /> and a shipped product.
              </>
            }
            description="University courses teach foundations. They rarely teach the decisions that turn a foundation into software a team would ship — architecture, trade-offs, review, and delivery under real constraints."
          />
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-12">
          <Reveal className="lg:col-span-5">
            <Card tone="quiet" className="h-full p-6 sm:p-8">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-serif text-xl tracking-[-0.01em] text-ink">The gap we observed</h3>
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">
                  Friction
                </span>
              </div>
              <p className="mt-3 text-pretty text-sm leading-relaxed text-ink-muted">
                Seven recurring points where motivated students stall:
              </p>
              <ol className="mt-6 divide-y divide-ink/10 border-t border-ink/10">
                {problems.map((problem, index) => (
                  <li key={problem} className="flex items-start gap-4 py-3">
                    <span className="mt-0.5 font-mono text-xs text-ink-faint">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1 text-pretty text-sm leading-relaxed text-ink-soft">{problem}</span>
                    <Minus className="mt-1 h-3.5 w-3.5 shrink-0 text-sage" aria-hidden="true" />
                  </li>
                ))}
              </ol>
            </Card>
          </Reveal>

          <div className="lg:col-span-7">
            <Reveal delay={0.05}>
              <p className="max-w-xl text-sm leading-relaxed text-ink-muted">
                CodeVerse replaces that friction with an end-to-end scaffold: a career goal becomes a
                blueprint, the blueprint becomes milestones, and each milestone ends with reviewed,
                verifiable work you can show.
              </p>
            </Reveal>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {solutions.map((solution, index) => {
                const Icon = solution.icon;
                return (
                  <Reveal key={solution.title} delay={0.05 + index * 0.04}>
                    <Card interactive className="h-full p-6">
                      <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-forest/25 bg-forest/[0.06] text-forest">
                        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                      </span>
                      <h4 className="font-serif text-base leading-snug tracking-[-0.01em] text-ink">
                        {solution.title}
                      </h4>
                      <p className="mt-2 text-pretty text-sm leading-relaxed text-ink-muted">{solution.description}</p>
                    </Card>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
