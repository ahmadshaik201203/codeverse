'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

/**
 * Global smooth-scroll layer.
 *
 * Lenis drives the native scroll position with momentum; GSAP's ticker runs
 * the rAF loop so ScrollTrigger stays in sync. Mounted once from the root
 * layout. Entirely disabled when the visitor prefers reduced motion or has
 * turned smooth scrolling off in Settings (the `cv:smooth-scroll` event).
 *
 * The progress bar is written straight to the DOM inside Lenis' scroll
 * callback — updating React state per scroll frame would re-render the whole
 * header subtree on every frame.
 */
export default function SmoothScroll() {
  const barRef = useRef<HTMLDivElement>(null);
  const barTween = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const reduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.dataset.motion === 'reduced';
    if (reduced) return;

    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({
      duration: 1.05,
      anchors: true,
      smoothWheel: true,
    });

    const onRaf = (time: number) => lenis.raf(time * 1000);

    const applyPreference = (enabled: boolean) => {
      if (enabled) {
        gsap.ticker.add(onRaf);
        lenis.start();
      } else {
        gsap.ticker.remove(onRaf);
        lenis.stop();
      }
    };

    lenis.on('scroll', ScrollTrigger.update);
    applyPreference(window.localStorage.getItem('cv:smooth-scroll') !== 'off');

    const onPreference = (event: Event) => {
      applyPreference((event as CustomEvent<boolean>).detail !== false);
    };
    window.addEventListener('cv:smooth-scroll', onPreference);

    gsap.ticker.lagSmoothing(0);

    const bar = barRef.current;
    if (bar) {
      barTween.current = gsap.to(bar, {
        scaleX: 1,
        ease: 'none',
        paused: true,
      });
      lenis.on('scroll', ({ progress }: { progress: number }) => {
        if (barTween.current) {
          barTween.current.progress(progress || 0);
        }
      });
    }

    return () => {
      window.removeEventListener('cv:smooth-scroll', onPreference);
      gsap.ticker.remove(onRaf);
      barTween.current?.kill();
      lenis.destroy();
    };
  }, []);

  return (
    <div
      ref={barRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-forest/70 will-change-transform"
      style={{ transform: 'scaleX(0)' }}
    />
  );
}
