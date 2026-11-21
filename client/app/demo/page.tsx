'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Badge';
import { ArrowLeft, ArrowRight, FileCode2, ListChecks, MessagesSquare } from 'lucide-react';

const panels = [
  {
    icon: ListChecks,
    label: 'Blueprint',
    title: 'A plan before the first commit',
    body: 'Domain, stack rationale, schema, API surface and six milestones — generated first, so the build has a spine.',
    rows: ['System architecture', 'Data model & API', 'Milestone checkpoints'],
  },
  {
    icon: FileCode2,
    label: 'Workspace',
    title: 'Build inside the plan',
    body: 'A coding surface with file tabs and an inline reviewer that reads the milestone you are on rather than generic lint rules.',
    rows: ['Monaco editor', 'Multi-file sandbox', 'Automated review'],
  },
  {
    icon: MessagesSquare,
    label: 'Mentor',
    title: 'Ask when the design is unclear',
    body: 'Context-aware help on the current project: debugging, trade-offs and interview-style explanations of your own code.',
    rows: ['Project context', 'Debugging help', 'Mock interview rounds'],
  },
];

export default function DemoPage() {
  return (
    <main className="flex min-h-screen flex-col text-ink">
      <Navbar />

      <section className="pb-16 pt-32 sm:pt-36">
        <Container>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-faint transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to CodeVerse
          </Link>

          <div className="mt-8 max-w-2xl">
            <Eyebrow>Product preview</Eyebrow>
            <h1 className="mt-5 font-serif text-[clamp(2.25rem,5vw,3.4rem)] leading-[1.06] tracking-[-0.035em] text-ink">
              See how a domain becomes
              <span className="italic text-forest"> a finished project.</span>
            </h1>
            <p className="mt-5 text-[15.5px] leading-relaxed text-ink-muted">
              This page walks through the three surfaces you work in. A recorded walk-through is not
              published yet; the panels below describe exactly what each surface does today.
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button href="/register" size="lg">
              Try it with your own project
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button href="/login" variant="secondary" size="lg">
              Sign in
            </Button>
          </div>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <div className="grid gap-4 lg:grid-cols-3">
            {panels.map((panel, index) => {
              const Icon = panel.icon;
              return (
                <article key={panel.label} className="surface flex flex-col rounded-card p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-forest/25 bg-forest/[0.06] text-forest">
                      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      0{index + 1} · {panel.label}
                    </span>
                  </div>

                  <h2 className="mt-6 font-serif text-[21px] leading-snug tracking-[-0.015em] text-ink">
                    {panel.title}
                  </h2>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-muted">{panel.body}</p>

                  <ul className="mt-6 space-y-2.5 border-t border-ink/10 pt-4">
                    {panel.rows.map((row) => (
                      <li key={row} className="flex items-center justify-between text-[12.5px]">
                        <span className="text-ink-soft">{row}</span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                          Included
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}
