'use client';

import React from 'react';
import { ArrowRight, Play } from 'lucide-react';
import { Container } from './ui/Container';
import { Button } from './ui/Button';
import { JellyButton } from './ui/JellyButton';
import { Reveal } from './ui/Reveal';

export default function CTA() {
  return (
    <section id="cta" className="border-t border-ink/10 py-20 sm:py-28">
      <Container>
        <Reveal>
          <div className="surface-strong relative overflow-hidden rounded-panel px-6 py-12 text-center sm:px-12 sm:py-16">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full border border-forest/15"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-16 -left-12 h-56 w-56 rounded-full border border-sage/25"
            />

            <p className="eyebrow eyebrow-center justify-center">Early access</p>

            <h2 className="mx-auto mt-6 max-w-[680px] text-balance font-serif text-3xl font-semibold leading-none tracking-[-0.03em] text-ink sm:text-4xl lg:text-5xl">
              Stop following tutorials.
              <span className="text-forest"> Start shipping evidence.</span>
            </h2>

            <p className="mx-auto mt-4 max-w-[680px] text-pretty text-base leading-relaxed text-ink-muted">
              Graduate with a portfolio of reviewed work, system design experience and interview
              preparation that is grounded in projects you actually built.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <JellyButton href="/register">
                Create your account
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </JellyButton>
              <Button href="/demo" variant="secondary" size="lg">
                <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                Explore the demo
              </Button>
            </div>

            <p className="mt-6 font-mono text-xs uppercase tracking-[0.16em] text-ink-faint">
              Free to start · No credit card required
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
