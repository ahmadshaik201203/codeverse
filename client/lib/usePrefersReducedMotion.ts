'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks the OS reduced-motion setting (and its live changes).
 *
 * This exists so components that only need the preference — Reveal,
 * HowItWorks, Hero — do not pull the whole framer-motion runtime into the
 * landing-page bundle just to call `useReducedMotion()`.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);

    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
