'use client';

import React from 'react';
import Link from 'next/link';
import { Terminal } from 'lucide-react';
import { Container } from './ui/Container';

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

const footerSections = [
  {
    title: 'Platform',
    links: [
      { label: 'About CodeVerse', href: '#about' },
      { label: 'The method', href: '#how-it-works' },
      { label: 'Domains', href: '#domains' },
      { label: 'Capabilities', href: '#features' },
    ],
  },
  {
    title: 'Learning tracks',
    links: [
      { label: 'AI & machine learning', href: '#domains' },
      { label: 'Full stack development', href: '#domains' },
      { label: 'Data science', href: '#domains' },
      { label: 'Mobile development', href: '#domains' },
      { label: 'Generative AI', href: '#domains' },
    ],
  },
  {
    title: 'Tools',
    links: [
      { label: 'Project blueprint', href: '/register' },
      { label: 'Skill gap analyser', href: '/register' },
      { label: 'AI mentor', href: '/register' },
      { label: 'Mock interviews', href: '/register' },
      { label: 'Resume analyser', href: '/register' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Create account', href: '/register' },
      { label: 'Sign in', href: '/login' },
      { label: 'Demo', href: '/demo' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-ink/10 pb-10 pt-12">
      <Container size="wide">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2" aria-label="CodeVerse home">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-forest text-ivory-warm">
                <Terminal className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="font-serif text-lg tracking-[-0.02em] text-ink">
                Code<span className="text-forest">Verse</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-pretty text-sm leading-relaxed text-ink-muted">
              From career ambition to verified job readiness. AI-assisted engineering education built
              around real work.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="CodeVerse on GitHub"
                className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-ink/12 text-ink-faint transition-colors hover:border-forest/40 hover:text-forest"
              >
                <GithubIcon />
              </a>
            </div>
          </div>

          {footerSections.map((section) => (
            <nav key={section.title} aria-label={section.title} className="lg:col-span-2">
              <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
                {section.title}
              </h2>
              <ul className="mt-4 space-y-2">
                {section.links.map((link) => (
                  <li key={`${section.title}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-muted transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-ink/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-faint">
            © {currentYear} CodeVerse. All rights reserved.
          </p>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">
            Built with care · Not a tutorial mill
          </p>
        </div>
      </Container>
    </footer>
  );
}
