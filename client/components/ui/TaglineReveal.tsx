'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

type TaglineRevealProps = {
  text: string;
  className?: string;
};

/**
 * Design skill B11: one large statement, separate from the hero, whose words
 * resolve from a muted tone to the full text colour in reading order as they
 * cross a trigger line.
 *
 * Words are visible at full strength until the effect is armed on mount, so a
 * blocked or failed script never leaves the sentence dimmed. Reduced motion
 * shows the final state immediately.
 */
export function TaglineReveal({ text, className }: TaglineRevealProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(' ');

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const reduce =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.dataset.motion === 'reduced';
    if (reduce || typeof IntersectionObserver === 'undefined') return;

    const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-word]'));
    if (nodes.length === 0) return;

    // Arm: dim every word, then light it as it reaches the trigger line.
    for (const node of nodes) node.dataset.armed = 'true';

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.lit = 'true';
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -38% 0px', threshold: 0 },
    );

    for (const node of nodes) observer.observe(node);

    return () => observer.disconnect();
  }, [text]);

  return (
    <p
      ref={ref}
      className={cn(
        'max-w-[680px] text-balance font-serif text-3xl leading-tight tracking-[-0.02em] text-ink sm:text-4xl',
        className,
      )}
    >
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="tagline-word"
          data-word
          style={{ transitionDelay: `${Math.min(index * 40, 600)}ms` }}
        >
          {word}
          {index < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </p>
  );
}
