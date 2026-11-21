'use client';

import React from 'react';
import Image from 'next/image';
import { Card } from './ui/Card';

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

interface TeamMember {
  name: string;
  role: string;
  avatar: string;
  bio: string;
  github?: string;
  linkedin?: string;
}

interface TeamCardProps {
  member: TeamMember;
}

export default function TeamCard({ member }: TeamCardProps) {
  return (
    <Card className="flex h-full flex-col p-6">
      <div className="relative h-16 w-16 overflow-hidden rounded-full border border-ink/10">
        <Image
          src={member.avatar}
          alt={`Portrait of ${member.name}`}
          fill
          sizes="64px"
          className="object-cover"
          unoptimized
        />
      </div>

      <h3 className="mt-5 font-serif text-[17px] leading-snug tracking-[-0.01em] text-ink">{member.name}</h3>
      <p className="mt-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-forest">{member.role}</p>
      <p className="mt-4 flex-1 text-[12.5px] leading-relaxed text-ink-muted">{member.bio}</p>

      <div className="mt-5 flex items-center gap-2 border-t border-ink/10 pt-4">
        {member.github ? (
          <a
            href={member.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${member.name} on GitHub`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-ink/12 text-ink-faint transition-colors hover:border-forest/40 hover:text-forest"
          >
            <GithubIcon />
          </a>
        ) : null}
        {member.linkedin ? (
          <a
            href={member.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${member.name} on LinkedIn`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-ink/12 text-ink-faint transition-colors hover:border-forest/40 hover:text-forest"
          >
            <LinkedinIcon />
          </a>
        ) : null}
      </div>
    </Card>
  );
}
