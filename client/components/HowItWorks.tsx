'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Award, ClipboardCheck, Cpu, Hammer, Map, Target } from 'lucide-react';
import { Container } from './ui/Container';
import { SectionHeading } from './ui/SectionHeading';
import { Reveal } from './ui/Reveal';
import { Button } from './ui/Button';
import { cn } from '@/lib/cn';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

const steps = [
  {
    step: '01',
    title: 'Choose Your Career Goal',
    description: 'Select your target domain, such as Full Stack Development, AI/ML or Data Science.',
    icon: Target,
  },
  {
    step: '02',
    title: 'Assess Your Skills',
    description: 'Evaluate existing skills and identify knowledge gaps.',
    icon: ClipboardCheck,
  },
  {
    step: '03',
    title: 'Generate AI Blueprint',
    description: 'Generate a personalized project blueprint with architecture, technologies, modules and database design.',
    icon: Cpu,
  },
  {
    step: '04',
    title: 'Follow Your Roadmap',
    description: 'Break the project into manageable milestones and track completion.',
    icon: Map,
  },
  {
    step: '05',
    title: 'Build Real Projects',
    description: 'Build practical projects with AI assistance, debugging and explanations.',
    icon: Hammer,
  },
  {
    step: '06',
    title: 'Become Job Ready',
    description: 'Complete AI code reviews, mock interviews and career preparation.',
    icon: Award,
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  // Sample the section's position on the same scroll loop Lenis drives.
  // Updating state only when the step changes keeps this section out of the
  // per-frame render path.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const start = window.innerHeight * 0.8;
      const end = window.innerHeight * 0.45;
      const span = end - rect.top;
      const value = Math.min(1, Math.max(0, span / (start - end)));
      const next = Math.min(steps.length - 1, Math.max(0, Math.floor(value * steps.length)));
      setActiveIndex((current) => (current === next ? current : next));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section id="how-it-works" ref={sectionRef} className="border-t border-ink/10 py-20 sm:py-28">
      <Container size="wide">
        <Reveal>
          <SectionHeading
            eyebrow="How CodeVerse works"
            title={
              <>
                Six deliberate steps from
                <br className="hidden sm:block" /> ambition to evidence.
              </>
            }
            description="A progression designed to remove ambiguity: every step produces an artefact the next step depends on."
          />
        </Reveal>

        {/* Scroll progress */}
        <div className="mt-10 h-[2px] overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
          <div
            className="h-full origin-left bg-forest/70 will-change-transform"
            style={{ transform: `scaleX(${reducedMotion ? 1 : (activeIndex + 1) / steps.length})` }}
          />
        </div>

        <div className="relative mt-8">
          {/* Connector line across the number row (desktop only; cards sit on it). */}
          <div aria-hidden="true" className="absolute inset-x-0 top-[27px] hidden h-px bg-ink/10 lg:block" />

          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((item, index) => {
              const Icon = item.icon;
              const reached = index <= activeIndex;
              const current = index === activeIndex;
              return (
                <li key={item.step} className="h-full">
                  <Reveal delay={index * 0.07} className="h-full">
                  <div
                    className={cn(
                      'surface relative flex h-full flex-col rounded-card p-6 transition-[border-color,box-shadow] duration-500',
                      current
                        ? 'border-forest/35 shadow-card'
                        : 'border-ink/10',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'relative z-[1] font-serif text-lg leading-none tracking-[0.02em] transition-colors duration-500',
                          reached ? 'text-forest' : 'text-ink-faint',
                        )}
                      >
                        {item.step}
                      </span>
                      <span
                        className={cn(
                          'relative z-[1] flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-500',
                          reached
                            ? 'border-forest/30 bg-forest/[0.08] text-forest'
                            : 'border-ink/12 text-ink-faint',
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </div>

                    <h3 className="mt-4 font-serif text-lg leading-snug tracking-[-0.01em] text-ink">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-pretty text-sm leading-relaxed text-ink-muted">{item.description}</p>

                    <span
                      className={cn(
                        'mt-auto pt-4 font-mono text-xs uppercase tracking-[0.16em] transition-colors duration-500',
                        current ? 'text-forest' : 'text-ink-faint',
                      )}
                    >
                      {current ? 'You are here' : reached ? 'Completed' : 'Upcoming'}
                    </span>
                  </div>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>

        <Reveal delay={0.1} className="mt-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <Button href="/register" size="lg" className="sm:min-w-[200px]">
              Start Your Journey
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink-faint">
              Create a free account to begin onboarding
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
