'use client';

import React from 'react';
import TeamCard from './TeamCard';
import { Container } from './ui/Container';
import { SectionHeading } from './ui/SectionHeading';
import { Reveal } from './ui/Reveal';

const teamMembers = [
  {
    name: 'Ahmad Shaik',
    role: 'Founding Engineer & Architect',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    bio: 'Full-stack builder passionate about developer tooling, agentic workflows, and making software education accessible.',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
  },
  {
    name: 'Sarah Chen',
    role: 'Head of AI Systems',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    bio: 'Former ML researcher focused on LLM orchestration, structured output generation, and pedagogical AI models.',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
  },
  {
    name: 'Marcus Vance',
    role: 'Curriculum & Industry Lead',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    bio: 'Ex-tech recruiter and engineering manager bridging the gap between university syllabi and production software.',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
  },
  {
    name: 'Elena Rostova',
    role: 'Lead Product Designer',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    bio: 'Specialising in frictionless developer UX, high-density dashboard visualization, and accessible user flows.',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
  },
];

/**
 * Dormant by design (2026-11-12): the "Our Team" section is no longer mounted
 * in app/page.tsx, its '#team' navigation link is removed from Navbar and the
 * 'Team' footer link is removed. The component, its card and the profile data
 * below are intentionally kept so a real team section can be restored quickly.
 */
export default function Team() {
  return (
    <section id="team" className="border-t border-ink/10 py-20 sm:py-28">
      <Container size="wide">
        <Reveal>
          <SectionHeading
            eyebrow="The builders"
            title="Built by engineers, for the next generation of engineers."
            description="We want to replace passive tutorial consumption with active, verified engineering practice."
          />
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {teamMembers.map((member, index) => (
            <Reveal key={member.name} delay={index * 0.04}>
              <TeamCard member={member} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
