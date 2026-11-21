'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Flame,
  GitBranch,
  Globe,
  GraduationCap,
  Zap,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { apiFetchRaw } from '@/lib/api';

interface PortfolioData {
  fullName: string;
  username: string;
  college: string;
  department: string;
  year: string;
  careerGoal?: string;
  experienceLevel?: string;
  bio: string;
  githubUrl: string;
  linkedinUrl: string;
  portfolioWebsite: string;
  xp: number;
  level: number;
  streak: number;
  badges: Array<{ id: string; name: string; icon: string; description: string }>;
  skills: Array<{ name: string; score: number }>;
  showcaseProjects: Array<{
    _id: string;
    title: string;
    shortDescription: string;
    difficulty: string;
    estimatedHours: number;
    tags: string[];
  }>;
}

export default function PublicPortfolioPage() {
  const params = useParams();
  const username = params.username as string;

  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await apiFetchRaw(`/portfolio/${username}`);
        if (res.ok) {
          const data = await res.json();
          setPortfolio(data.portfolio);
        } else if (res.status === 404) {
          setPortfolio(null);
          setNotFound(true);
        } else {
          setPortfolio(null);
          setError('This portfolio could not be loaded right now.');
        }
      } catch {
        setPortfolio(null);
        setError('Could not reach the CodeVerse API.');
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchPortfolio();
  }, [username, reloadKey]);

  return (
    <main className="flex min-h-screen flex-col text-ink">
      <Navbar />

      <div className="flex-1 pb-20 pt-32 sm:pt-36">
        <Container>
          {loading ? (
            <div className="space-y-6">
              <div className="h-44 animate-pulse rounded-panel bg-ink/[0.06]" />
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((row) => (
                  <div key={row} className="h-20 animate-pulse rounded-card bg-ink/[0.06]" />
                ))}
              </div>
            </div>
          ) : error ? (
            <EmptyState
              tone="error"
              title="Portfolio unavailable"
              description={error}
              action={
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setError('');
                    setLoading(true);
                    setReloadKey((key) => key + 1);
                  }}
                >
                  Retry
                </Button>
              }
              className="py-16"
            />
          ) : !portfolio ? (
            <EmptyState
              title={notFound ? 'Portfolio not found' : 'Portfolio not found'}
              description="No published portfolio exists at this address yet."
              action={
                <Button href="/dashboard" variant="secondary" size="sm">
                  Go to the platform
                </Button>
              }
              className="py-16"
            />
          ) : (
            <div className="space-y-12">
              {/* Header */}
              <header className="surface rounded-panel p-6 sm:p-9">
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="eyebrow">Verified student portfolio</p>
                    <h1 className="mt-4 font-serif text-[clamp(2rem,4.4vw,3rem)] leading-[1.06] tracking-[-0.03em] text-ink">
                      {portfolio.fullName}
                    </h1>
                    <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                      @{portfolio.username} · Level {portfolio.level}
                      {portfolio.careerGoal ? ` · ${portfolio.careerGoal}` : ''}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-ink-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <GraduationCap className="h-4 w-4 text-ink-faint" aria-hidden="true" />
                        {portfolio.college} ({portfolio.department})
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-ink-faint" aria-hidden="true" />
                        Class of {portfolio.year}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Flame className="h-4 w-4 text-ink-faint" aria-hidden="true" />
                        {portfolio.streak} day streak
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {portfolio.githubUrl ? (
                      <a
                        href={portfolio.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="GitHub profile"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-ink/15 text-ink-soft transition-colors hover:border-forest/40 hover:text-forest"
                      >
                        <GitBranch className="h-4 w-4" />
                      </a>
                    ) : null}
                    {portfolio.linkedinUrl ? (
                      <a
                        href={portfolio.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="LinkedIn profile"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-ink/15 text-ink-soft transition-colors hover:border-forest/40 hover:text-forest"
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    ) : null}
                    {portfolio.portfolioWebsite ? (
                      <a
                        href={portfolio.portfolioWebsite}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Personal website"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-ink/15 text-ink-soft transition-colors hover:border-forest/40 hover:text-forest"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : null}
                  </div>
                </div>

                {portfolio.bio ? (
                  <p className="mt-6 max-w-3xl border-t border-ink/10 pt-6 text-[13.5px] leading-relaxed text-ink-muted">
                    {portfolio.bio}
                  </p>
                ) : null}

                <dl className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-ink/10 bg-ink/10 sm:grid-cols-4">
                  {[
                    { label: 'Total XP', value: portfolio.xp },
                    { label: 'Level', value: portfolio.level },
                    { label: 'Badges', value: portfolio.badges.length },
                    { label: 'Projects', value: portfolio.showcaseProjects.length },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-ivory-warm/70 px-4 py-4">
                      <dd className="font-serif text-[24px] leading-none tracking-[-0.02em] text-ink">
                        {stat.value}
                      </dd>
                      <dt className="mt-1.5 text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                        {stat.label}
                      </dt>
                    </div>
                  ))}
                </dl>
              </header>

              {/* Skills */}
              <section aria-labelledby="portfolio-skills" className="space-y-4">
                <h2
                  id="portfolio-skills"
                  className="flex items-center gap-2 font-serif text-[22px] tracking-[-0.015em] text-ink"
                >
                  <Zap className="h-4 w-4 text-forest" aria-hidden="true" />
                  Verified competencies
                </h2>

                {portfolio.skills.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {portfolio.skills.map((skill) => (
                      <Card key={skill.name} className="p-5">
                        <div className="flex items-baseline justify-between gap-4">
                          <span className="text-[13px] font-medium text-ink">{skill.name}</span>
                          <span className="font-mono text-[11px] text-forest">{skill.score}%</span>
                        </div>
                        <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-ink/10">
                          <div
                            className="h-full rounded-full bg-forest/75"
                            style={{ width: `${Math.max(0, Math.min(100, skill.score))}%` }}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Zap}
                    title="No verified skills yet"
                    description="Skill scores appear once submitted work has been evaluated."
                  />
                )}
              </section>

              {/* Projects */}
              <section aria-labelledby="portfolio-projects" className="space-y-4">
                <h2
                  id="portfolio-projects"
                  className="flex items-center gap-2 font-serif text-[22px] tracking-[-0.015em] text-ink"
                >
                  Shipped projects
                </h2>

                {portfolio.showcaseProjects.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {portfolio.showcaseProjects.map((project) => (
                      <Card key={project._id} interactive className="flex flex-col p-6">
                        <div className="flex items-center justify-between gap-3">
                          <Badge tone="outline">{project.difficulty}</Badge>
                          <span className="font-mono text-[10.5px] text-ink-faint">
                            {project.estimatedHours}h
                          </span>
                        </div>
                        <h3 className="mt-4 font-serif text-[18px] leading-snug tracking-[-0.01em] text-ink">
                          {project.title}
                        </h3>
                        <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-ink-muted">
                          {project.shortDescription}
                        </p>
                        {project.tags.length > 0 ? (
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {project.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full border border-ink/10 px-2 py-0.5 font-mono text-[10px] text-ink-faint"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-3.5 text-[12px]">
                          <span className="inline-flex items-center gap-1.5 text-ink-soft">
                            <CheckCircle2 className="h-3.5 w-3.5 text-forest/70" aria-hidden="true" />
                            Evaluator verified
                          </span>
                          <Link
                            href={`/projects/${project._id}`}
                            className="inline-flex items-center gap-1 text-forest underline-offset-4 hover:underline"
                          >
                            View spec
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </Link>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No shipped projects yet"
                    description="Completed and reviewed projects are published here."
                  />
                )}
              </section>

              {/* Badges */}
              <section aria-labelledby="portfolio-badges" className="space-y-4">
                <h2
                  id="portfolio-badges"
                  className="flex items-center gap-2 font-serif text-[22px] tracking-[-0.015em] text-ink"
                >
                  <Award className="h-4 w-4 text-forest" aria-hidden="true" />
                  Badges
                </h2>

                {portfolio.badges.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-3">
                    {portfolio.badges.map((badge) => (
                      <Card key={badge.id} className="p-5 text-center">
                        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-forest/25 bg-forest/[0.06] text-forest">
                          <Award className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <h3 className="mt-3 font-serif text-[16px] text-ink">{badge.name}</h3>
                        <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">{badge.description}</p>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Award}
                    title="No badges yet"
                    description="Badges are awarded for verified milestones."
                  />
                )}
              </section>
            </div>
          )}
        </Container>
      </div>

      <Footer />
    </main>
  );
}
