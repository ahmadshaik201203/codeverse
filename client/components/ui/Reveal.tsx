'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** Distance in px the element travels while fading in. */
  distance?: number;
};

/**
 * Quiet entrance used for landing sections.
 *
 * Root cause this replaces: the previous implementation was a framer-motion
 * `motion.div` whose server-rendered markup carried `opacity: 0` inline. If
 * hydration was slow, an IntersectionObserver never fired, or a script was
 * blocked, whole sections stayed permanently invisible.
 *
 * Now the element is visible by default (plain CSS, no JS required). Only
 * after mount, and only for elements that start below the fold, is the
 * hidden state applied and then released on intersection. Motion is skipped
 * entirely for reduced-motion visitors, and a timeout guarantees content is
 * never left hidden.
 */
export function Reveal({ children, delay = 0, className, distance = 32 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') return;

    const reduce =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.dataset.motion === 'reduced';
    if (reduce) return;

    // Elements already in the first viewport are left alone so the first
    // paint is complete; only below-the-fold content animates in.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    el.style.setProperty('--reveal-delay', `${delay}s`);
    el.style.setProperty('--reveal-distance', `${distance}px`);
    el.dataset.reveal = 'pending';

    const show = () => {
      el.dataset.reveal = 'in';
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            show();
            observer.disconnect();
          }
        }
      },
      { rootMargin: '0px 0px -60px 0px', threshold: 0.01 },
    );
    observer.observe(el);

    // Safety net: if the observer never reports (layout shifts, printing,
    // exotic scroll containers), the content still appears.
    const fallback = window.setTimeout(() => {
      show();
      observer.disconnect();
    }, 4000);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, [delay, distance]);

  return (
    <div ref={ref} className={cn('reveal', className)}>
      {children}
    </div>
  );
}
