import React from 'react';
import { Container } from './ui/Container';
import { TaglineReveal } from './ui/TaglineReveal';

/**
 * Design skill B11 — the tagline moment. Own section, own spacing, far enough
 * from the hero to read as a statement rather than a second hero.
 */
export default function Tagline() {
  return (
    <section id="tagline" aria-label="How CodeVerse works end to end" className="border-t border-ink/10 py-20 sm:py-24">
      <Container size="wide">
        <TaglineReveal text="A career goal becomes a blueprint. The blueprint becomes milestones. Each milestone ends with reviewed work you can show." />
      </Container>
    </section>
  );
}
