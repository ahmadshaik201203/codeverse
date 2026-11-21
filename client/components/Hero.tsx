'use client';

import React, { lazy, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Container } from './ui/Container';
import { Button } from './ui/Button';
import { JellyButton } from './ui/JellyButton';
import { cn } from '@/lib/cn';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

// The guided tour is a private, post-click surface. Splitting it out of the
// first-screen bundle keeps the hero's own GSAP controller cheap to load.
const WatchDemo = lazy(() => import('./WatchDemo'));

const META = [
  { value: '18+', label: 'Industry domains' },
  { value: '6-step', label: 'Verified method' },
  { value: 'AI', label: 'Mentor & reviewer' },
  { value: '0', label: 'Fake placeholders' },
];

const AUTOPLAY_MS = 5000;
const SLIDE_SECONDS = 0.7;

const SLIDE_META = [
  { label: 'Blueprint', name: 'System architecture' },
  { label: 'Roadmap', name: 'Milestone roadmap' },
  { label: 'AI Blueprint', name: 'Project structure' },
  { label: 'AI Review', name: 'Review & interview' },
] as const;

function SlideBody({ children }: { children: ReactNode }) {
  // Slides are always fully rendered, so the GSAP track carries the complete
  // card sideways instead of crossfading content in and out of view.
  return <div className="h-full px-4 py-4">{children}</div>;
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div data-stagger>
      <div className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.1em] text-ink-faint">
        <span>{label}</span>
        <span className="text-forest">{value}%</span>
      </div>
      <div className="mt-1 h-[3px] overflow-hidden rounded-full bg-ink/10">
        <div data-bar={value} className="h-full rounded-full bg-forest/70" style={{ width: '0%' }} />
      </div>
    </div>
  );
}

function ArchitectureSlide() {
  const nodes = [
    { name: 'Client', meta: 'web · mobile' },
    { name: 'API', meta: 'auth · routes' },
    { name: 'Database', meta: 'postgres' },
  ];

  return (
    <SlideBody>
      <p data-stagger className="font-mono text-xs uppercase tracking-[0.16em] text-ink-faint">
        System architecture
      </p>
      <div data-stagger className="mt-2 font-serif text-xl leading-tight tracking-[-0.02em] text-ink">
        ERD · API · <em className=" text-forest">modules</em>
      </div>

      <div data-stagger className="mt-3 rounded-control border border-ink/10 bg-white/60 px-4 py-3" aria-hidden="true">
        <div className="flex items-center gap-2">
          {nodes.map((node, i) => (
            <React.Fragment key={node.name}>
              <span className="rounded-lg border border-ink/10 bg-ivory-warm/90 px-2 py-1 text-center">
                <span className="block font-mono text-xs uppercase tracking-[0.08em] text-ink">{node.name}</span>
                <span className="mt-0.5 block font-mono text-xs uppercase tracking-[0.06em] text-ink-faint">
                  {node.meta}
                </span>
              </span>
              {i < nodes.length - 1 ? <span className="h-px flex-1 bg-forest/35" /> : null}
            </React.Fragment>
          ))}
        </div>
      </div>

      <ul data-stagger className="mt-3 space-y-2">
        {[
          { step: '01', title: 'System architecture', meta: 'ERD · API · modules' },
          { step: '02', title: 'Milestone roadmap', meta: '6 checkpoints' },
          { step: '03', title: 'Review & interview', meta: 'code + mock round' },
        ].map((row) => (
          <li
            key={row.step}
            className="flex items-start gap-3 border-t border-ink/10 pt-2 first:border-0 first:pt-0"
          >
            <span className="font-mono text-xs text-ink-faint">{row.step}</span>
            <span className="flex-1">
              <span className="block text-xs font-medium text-ink">{row.title}</span>
              <span className="mt-0.5 block text-xs text-ink-faint">{row.meta}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-2 space-y-1 border-t border-ink/10 pt-2">
        <Bar label="Architecture" value={92} />
        <Bar label="System design" value={85} />
      </div>
    </SlideBody>
  );
}

function RoadmapSlide() {
  const checkpoints = [
    { title: 'Foundations', state: 'done' },
    { title: 'System design', state: 'done' },
    { title: 'Async & errors', state: 'done' },
    { title: 'APIs & auth', state: 'current' },
    { title: 'Testing', state: 'todo' },
    { title: 'Interview', state: 'todo' },
  ] as const;

  return (
    <SlideBody>
      <p data-stagger className="font-mono text-xs uppercase tracking-[0.16em] text-ink-faint">
        6 learning checkpoints
      </p>
      <div data-stagger className="mt-2 font-serif text-xl leading-tight tracking-[-0.02em] text-ink">
        Milestone <em className=" text-forest">roadmap</em>
      </div>

      <ol data-stagger className="mt-4">
        {checkpoints.map((c, i) => (
          <li key={c.title} className="relative flex items-start gap-3 pb-3 last:pb-0">
            {i < checkpoints.length - 1 ? (
              <span className="absolute left-[7px] top-5 h-[calc(100%-16px)] w-px bg-ink/15" aria-hidden="true" />
            ) : null}
            <span
              className={cn(
                'relative z-[1] mt-0.5 flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border',
                c.state === 'done' && 'border-forest bg-forest text-ivory-warm',
                c.state === 'current' && 'border-forest bg-forest/15 text-forest',
                c.state === 'todo' && 'border-ink/25 bg-ivory-warm text-ink-faint',
              )}
            >
              {c.state === 'done' ? (
                <Check className="h-2.5 w-2.5" aria-hidden="true" />
              ) : (
                <span className="h-1 w-1 rounded-full bg-current" />
              )}
            </span>
            <span className="flex-1 text-xs font-medium text-ink">
              {c.title}
              {c.state === 'current' ? (
                <span className="ml-2 font-mono text-xs uppercase tracking-[0.14em] text-forest">Current</span>
              ) : null}
            </span>
            <span className="font-mono text-xs text-ink-faint">{String(i + 1).padStart(2, '0')}</span>
          </li>
        ))}
      </ol>

      <div className="mt-4">
        <Bar label="Roadmap progress" value={58} />
      </div>
    </SlideBody>
  );
}

function BlueprintCodeSlide() {
  const lines: { code: ReactNode }[] = [
    {
      code: (
        <>
          <span className="text-forest-deep">src/</span> <span className="text-ink-soft">components/</span>
        </>
      ),
    },
    {
      code: (
        <>
          <span className="text-forest-deep">src/</span> <span className="text-ink-soft">app/api/</span>{' '}
          <span className="text-ink-faint"># routes</span>
        </>
      ),
    },
    {
      code: (
        <>
          <span className="text-forest-deep">src/</span> <span className="text-ink-soft">lib/db/</span>{' '}
          <span className="text-ink-faint"># schema</span>
        </>
      ),
    },
    {
      code: (
        <>
          <span className="text-forest">const</span> <span className="text-ink"> blueprint </span>
          <span className="text-ink-soft">= await AI.build({'{'}</span>
        </>
      ),
    },
    {
      code: (
        <>
          {'  '}modules: [<span className="text-forest-deep">&quot;auth&quot;</span>,{' '}
          <span className="text-forest-deep">&quot;billing&quot;</span>,{' '}
          <span className="text-forest-deep">&quot;search&quot;</span>]
        </>
      ),
    },
    {
      code: (
        <>
          {'  '}database: <span className="text-forest-deep">&quot;postgres&quot;</span>
        </>
      ),
    },
    { code: <span className="text-ink-soft">{'});'}</span> },
  ];

  return (
    <SlideBody>
      <p data-stagger className="font-mono text-xs uppercase tracking-[0.16em] text-ink-faint">
        Project structure
      </p>
      <div data-stagger className="mt-2 font-serif text-xl leading-tight tracking-[-0.02em] text-ink">
        Components · APIs · <em className=" text-forest">Database</em>
      </div>

      <pre
        data-stagger
        className="mt-4 overflow-x-auto rounded-control border border-ink/10 bg-white/60 p-3 font-mono text-xs leading-[1.7] text-ink-soft"
      >
        {lines.map((line, i) => (
          <div key={i} className="whitespace-pre">
            <code>{line.code}</code>
          </div>
        ))}
      </pre>

      <div data-stagger className="mt-4 flex flex-wrap gap-1">
        {['Components', 'APIs', 'Database', 'Tests'].map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-ink/10 bg-ivory-warm/70 px-2 py-1 text-xs text-ink-muted"
          >
            {tag}
          </span>
        ))}
      </div>
    </SlideBody>
  );
}

function ReviewSlide() {
  return (
    <SlideBody>
      <div data-stagger className="flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink-faint">
          Code review · Mock interview
        </p>
        <span className="rounded-full border border-forest/25 bg-forest/[0.08] px-2 py-0.5 font-mono text-xs uppercase tracking-[0.12em] text-forest-deep">
          Passed
        </span>
      </div>
      <div data-stagger className="mt-2 font-serif text-xl leading-tight tracking-[-0.02em] text-ink">
        Review <em className=" text-forest">status</em>
      </div>

      <div className="mt-4 space-y-4">
        <Bar label="Code quality" value={91} />
        <Bar label="Tests & integrity" value={84} />
        <Bar label="Interview readiness" value={78} />
      </div>

      <ul data-stagger className="mt-4 space-y-2 border-t border-ink/10 pt-4">
        {['Security scan clear', '2 refactoring suggestions', 'Mock round scheduled'].map((item) => (
          <li key={item} className="flex items-center gap-2 text-xs text-ink-soft">
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-forest/30 bg-forest/[0.08] text-forest">
              <Check className="h-2.5 w-2.5" aria-hidden="true" />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </SlideBody>
  );
}

const SLIDES = [
  { meta: SLIDE_META[0], render: ArchitectureSlide },
  { meta: SLIDE_META[1], render: RoadmapSlide },
  { meta: SLIDE_META[2], render: BlueprintCodeSlide },
  { meta: SLIDE_META[3], render: ReviewSlide },
] as const;

export default function Hero() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const rootRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const indexRef = useRef(0);
  const pausedRef = useRef(false);
  const reducedRef = useRef(false);
  const progressTweenRef = useRef<gsap.core.Tween | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    reducedRef.current = reducedMotion;
  }, [reducedMotion]);

  const restartProgress = useCallback(() => {
    const bar = progressBarRef.current;
    if (!bar) return;
    progressTweenRef.current?.kill();
    if (reducedRef.current) {
      gsap.set(bar, { scaleX: 0 });
      return;
    }
    progressTweenRef.current = gsap.fromTo(
      bar,
      { scaleX: 0 },
      { scaleX: 1, duration: AUTOPLAY_MS / 1000, ease: 'none', paused: pausedRef.current },
    );
  }, []);

  const moveTo = useCallback(
    (next: number, instant = false) => {
      const i = ((next % SLIDES.length) + SLIDES.length) % SLIDES.length;
      indexRef.current = i;
      setIndex(i);

      const track = trackRef.current;
      if (!track) return;

      gsap.to(track, {
        xPercent: -100 * i,
        duration: instant || reducedRef.current ? 0 : SLIDE_SECONDS,
        ease: 'power2.inOut',
        overwrite: 'auto',
      });

      const slide = track.children[i] as HTMLElement | undefined;
      if (slide) {
        gsap.fromTo(
          slide.querySelectorAll('[data-stagger]'),
          { opacity: 0, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: 'power3.out',
            stagger: 0.05,
            overwrite: 'auto',
            delay: 0.08,
          },
        );
        slide.querySelectorAll('[data-bar]').forEach((el) => {
          const value = el.getAttribute('data-bar') || '0';
          gsap.fromTo(
            el,
            { width: '0%' },
            { width: `${value}%`, duration: 0.7, ease: 'power3.out', delay: 0.15, overwrite: 'auto' },
          );
        });
      }

      restartProgress();
    },
    [restartProgress],
  );

  // Single GSAP context for mount-time setup (StrictMode-safe: reverted on
  // cleanup), including the gentle scrub parallax on the preview card.
  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      gsap.set(trackRef.current, { xPercent: 0 });
      moveTo(0, true);

      if (cardRef.current && !reducedRef.current) {
        gsap.fromTo(
          cardRef.current,
          { y: 16 },
          {
            y: -16,
            ease: 'none',
            scrollTrigger: {
              trigger: rootRef.current,
              start: 'top top',
              end: 'bottom top',
              scrub: 0.6,
            },
          },
        );
      }
    },
    { scope: rootRef },
  );

  useEffect(() => {
    if (paused || reducedMotion) return;
    const id = window.setInterval(() => moveTo(indexRef.current + 1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, reducedMotion, moveTo]);

  useEffect(() => {
    if (paused) progressTweenRef.current?.pause();
    else progressTweenRef.current?.resume();
  }, [paused]);

  useEffect(
    () => () => {
      progressTweenRef.current?.kill();
    },
    [],
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    if (dx < -40) moveTo(indexRef.current + 1);
    else if (dx > 40) moveTo(indexRef.current - 1);
    touchStartX.current = null;
  };

  return (
    <section ref={rootRef} className="relative overflow-hidden pb-20 pt-32 sm:pt-36 lg:pb-28 lg:pt-40">
      <Container size="wide" className="relative">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <p className="eyebrow">Engineering education, rethought</p>

            <h1 className="mt-6 max-w-[680px] text-balance font-serif text-5xl font-semibold leading-none tracking-[-0.035em] text-ink sm:text-6xl">
              Learn. Build.
              <br />
              Practice.{' '}
              <span className="text-forest">
                Get
                <br className="hidden sm:block" /> job ready.
              </span>
            </h1>

            <p className="mt-6 max-w-[680px] text-pretty text-base leading-relaxed text-ink-muted">
              CodeVerse turns textbook theory into production engineering. Choose a domain, generate a
              structured blueprint, then build a real project with an AI mentor reviewing your work.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <JellyButton href="/register" className="sm:min-w-[168px]">
                Start building
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </JellyButton>
              <Button
                type="button"
                onClick={() => setDemoOpen(true)}
                variant="secondary"
                size="lg"
                className="sm:min-w-[148px]"
              >
                <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                Watch demo
              </Button>
            </div>

            <dl className="mt-12 grid max-w-2xl grid-cols-2 gap-y-4 border-t border-ink/10 pt-6 sm:grid-cols-4">
              {META.map((item) => (
                <div key={item.label} className="pr-4">
                  <dt className="sr-only">{item.label}</dt>
                  <dd>
                    <span className="block font-serif text-xl leading-none tracking-[-0.02em] text-ink">
                      {item.value}
                    </span>
                    <span className="mt-1 block text-xs uppercase tracking-[0.12em] text-ink-faint">
                      {item.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Blueprint preview — decorative, labelled as such. */}
          <div className="min-w-0 lg:col-span-5">
            <div ref={cardRef} className="relative mx-auto w-full min-w-0 max-w-[430px] lg:ml-auto">
              <div className="surface-strong rounded-panel p-1">
                <div
                  className="rounded-card border border-ink/10 bg-ivory-warm/70"
                  role="region"
                  aria-roledescription="carousel"
                  aria-label="Blueprint preview slides"
                  onMouseEnter={() => setPaused(true)}
                  onMouseLeave={() => setPaused(false)}
                  onFocus={() => setPaused(true)}
                  onBlur={() => setPaused(false)}
                >
                  <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
                    <span className="font-mono text-xs uppercase tracking-[0.16em] text-ink-faint">
                      Preview · {SLIDES[index].meta.label}
                    </span>
                    <span className="flex items-center gap-1 text-xs uppercase tracking-[0.14em] text-forest">
                      <span className="h-1.5 w-1.5 rounded-full bg-forest" aria-hidden="true" />
                      Draft
                    </span>
                  </div>

                  <div className="h-[2px] bg-ink/10" aria-hidden="true">
                    <div ref={progressBarRef} className="h-full origin-left bg-forest/70" style={{ transform: 'scaleX(0)' }} />
                  </div>

                  <div
                    className="relative h-[398px] w-full min-w-0 overflow-hidden sm:h-[386px]"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div ref={trackRef} className="flex h-full w-full min-w-0 will-change-transform">
                      {SLIDES.map((slide, i) => (
                        <article
                          key={slide.meta.name}
                          className="h-full w-full min-w-0 shrink-0"
                          role="group"
                          aria-roledescription="slide"
                          aria-label={`${i + 1} of ${SLIDES.length}: ${slide.meta.name}`}
                          aria-hidden={i !== index}
                        >
                          <slide.render />
                        </article>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-ink/10 px-4 py-3">
                    <div className="flex items-center gap-2" role="tablist" aria-label="Blueprint preview slides">
                      {SLIDES.map((slide, i) => (
                        <button
                          key={slide.meta.name}
                          type="button"
                          role="tab"
                          aria-selected={i === index}
                          aria-label={`Go to slide ${i + 1}: ${slide.meta.name}`}
                          onClick={() => moveTo(i)}
                          className="flex h-6 min-w-[22px] items-center justify-center"
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              'h-[6px] rounded-full transition-[width,background-color] duration-300 ease-out',
                              i === index ? 'w-[22px] bg-forest' : 'w-[6px] bg-ink/20',
                            )}
                          />
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Previous slide"
                        onClick={() => moveTo(indexRef.current - 1)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-ink-soft transition-colors hover:border-forest/40 hover:text-forest"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label="Next slide"
                        onClick={() => moveTo(indexRef.current + 1)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-ink-soft transition-colors hover:border-forest/40 hover:text-forest"
                      >
                        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-center font-mono text-xs uppercase tracking-[0.16em] text-ink-faint lg:text-right">
                Illustration of the generated blueprint
              </p>
            </div>
          </div>
        </div>
      </Container>

      {demoOpen ? (
        <React.Suspense fallback={null}>
          <WatchDemo open={demoOpen} onClose={() => setDemoOpen(false)} />
        </React.Suspense>
      ) : null}
    </section>
  );
}
