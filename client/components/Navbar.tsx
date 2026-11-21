'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, Terminal, X } from 'lucide-react';
import { cn } from '@/lib/cn';

// '#team' was removed with the Team section (2026-11-12); re-add the entry
// here together with <Team /> in app/page.tsx when the section returns.
const LINKS = [
  { href: '#about', label: 'About' },
  { href: '#how-it-works', label: 'Method' },
  { href: '#domains', label: 'Domains' },
  { href: '#features', label: 'Capabilities' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      {/* Floating bar: translucent surface over a blur, sized to the content. */}
      <div
        className={cn(
          'mx-auto w-full max-w-7xl rounded-panel border backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          scrolled || isOpen
            ? 'border-ink/12 bg-[rgba(251,250,246,0.9)] shadow-card'
            : 'border-ink/8 bg-[rgba(251,250,246,0.6)]',
        )}
      >
        <div className="flex h-16 items-center justify-between gap-6 px-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-forest text-ivory-warm shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-colors group-hover:bg-forest-deep">
              <Terminal className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="flex items-baseline gap-2">
              <span className="font-serif text-xl leading-none tracking-[-0.02em] text-ink">
                Code<span className="text-forest">Verse</span>
                <span className="sr-only"> home</span>
              </span>
              <span className="hidden rounded-full border border-ink/15 px-2 py-0.5 text-xs font-medium uppercase tracking-[0.14em] text-ink-faint sm:inline-block">
                Beta
              </span>
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-6 lg:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative text-sm font-semibold text-ink-muted transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-forest after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-ink hover:after:scale-x-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/login"
              className="rounded-control px-3 py-2 text-sm font-medium text-ink-soft transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-ink/[0.05] hover:text-ink"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex h-10 items-center justify-center rounded-control bg-forest px-4 text-sm font-semibold text-ivory-warm shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_22px_-14px_rgba(37,40,39,0.8)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-forest-deep active:translate-y-px"
            >
              Create account
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-control border border-ink/15 text-ink transition-colors duration-300 hover:bg-ink/[0.05] md:hidden"
          >
            <span className="relative block h-4 w-4" aria-hidden="true">
              <Menu
                className={cn(
                  'absolute inset-0 h-4 w-4 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                  isOpen ? 'rotate-90 scale-75 opacity-0' : 'rotate-0 scale-100 opacity-100',
                )}
              />
              <X
                className={cn(
                  'absolute inset-0 h-4 w-4 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                  isOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-75 opacity-0',
                )}
              />
            </span>
          </button>
        </div>
      </div>

      {isOpen ? (
        <div
          id="mobile-navigation"
          className="fixed inset-x-3 bottom-3 top-[86px] overflow-y-auto rounded-panel border border-ink/12 bg-[rgba(251,250,246,0.96)] px-5 pb-8 pt-2 backdrop-blur-2xl md:hidden"
        >
          <nav aria-label="Mobile">
            <ul className="divide-y divide-ink/10">
              {LINKS.map((link, index) => (
                <li
                  key={link.href}
                  className="nav-item-enter"
                  style={{ animationDelay: `${Math.min(index * 60, 400)}ms` }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between py-4 text-base font-semibold text-ink-soft transition-colors duration-300 hover:text-ink"
                  >
                    {link.label}
                    <span aria-hidden="true" className="text-ink-faint">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="nav-item-enter inline-flex h-11 w-full items-center justify-center rounded-control border border-ink/20 text-sm font-medium text-ink"
                style={{ animationDelay: '240ms' }}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className="nav-item-enter inline-flex h-11 w-full items-center justify-center rounded-control bg-forest text-sm font-semibold text-ivory-warm"
                style={{ animationDelay: '300ms' }}
              >
                Create account
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
