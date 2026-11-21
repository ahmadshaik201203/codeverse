'use client';

import React, { useEffect, useState } from 'react';
import { Filter, Search, SlidersHorizontal } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import ProjectCard, { ProjectData } from '@/components/ProjectCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { apiFetchRaw } from '@/lib/api';

const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const tags = ['All', 'Web', 'API', 'AI', 'SaaS', 'Industry'];

export default function ProjectsDiscoveryPage() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeDifficulty, setActiveDifficulty] = useState('All');
  const [activeTag, setActiveTag] = useState('All');
  const [sortBy, setSortBy] = useState('recommended');

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError('');
      try {
        const queryParams = new URLSearchParams();

        if (searchQuery) queryParams.append('search', searchQuery);
        if (activeDifficulty !== 'All') queryParams.append('difficulty', activeDifficulty);
        if (activeTag !== 'All') queryParams.append('tag', activeTag);
        if (sortBy) queryParams.append('sort', sortBy);

        const res = await apiFetchRaw(`/projects?${queryParams.toString()}`);

        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects ?? []);
        } else {
          setProjects([]);
          setError('Projects could not be loaded right now.');
        }
      } catch {
        setProjects([]);
        setError('Could not reach the CodeVerse API.');
      } finally {
        setLoading(false);
      }
    };

    const timerId = setTimeout(() => {
      fetchProjects();
    }, 300);

    return () => clearTimeout(timerId);
  }, [searchQuery, activeDifficulty, activeTag, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setActiveDifficulty('All');
    setActiveTag('All');
  };

  return (
    <DashboardLayout>
      <div className="space-y-7">
        <PageHeader
          eyebrow="Project library"
          title="Choose what to build next"
          description="Production-grade capstone projects across every domain, each with a generated blueprint."
        />

        <div className="space-y-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
              aria-hidden="true"
            />
            <label htmlFor="project-search" className="sr-only">
              Search projects
            </label>
            <input
              id="project-search"
              type="search"
              placeholder="Search projects, skills or technologies…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-control border border-ink/15 bg-ivory-warm/60 pl-9 pr-3 text-[13.5px] text-ink placeholder:text-ink-faint focus:border-forest/60 focus:bg-ivory-warm focus:outline-none focus:ring-2 focus:ring-forest/15"
            />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                <Filter className="h-3.5 w-3.5" aria-hidden="true" />
                Tags
              </span>
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={activeTag === tag}
                  onClick={() => setActiveTag(tag)}
                  className={cn(
                    'shrink-0 rounded-full border px-3 py-1.5 text-[12px] transition-colors duration-150',
                    activeTag === tag
                      ? 'border-forest/45 bg-forest/[0.08] text-forest-deep'
                      : 'border-ink/12 text-ink-muted hover:border-ink/25 hover:text-ink',
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-ink-faint" aria-hidden="true" />
              <label htmlFor="sort-projects" className="sr-only">
                Sort projects
              </label>
              <select
                id="sort-projects"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 cursor-pointer rounded-control border border-ink/15 bg-ivory-warm/60 px-2.5 text-[12.5px] text-ink-soft focus:border-forest/60 focus:outline-none"
              >
                <option value="recommended">Recommended first</option>
                <option value="new">Newest arrivals</option>
                <option value="popularity">Highest popularity</option>
                <option value="difficulty">By difficulty</option>
              </select>
            </div>
          </div>

          <div
            className="flex flex-wrap items-center gap-1 border-t border-ink/10 pt-4"
            role="group"
            aria-label="Filter by difficulty"
          >
            {difficulties.map((difficulty) => (
              <button
                key={difficulty}
                type="button"
                aria-pressed={activeDifficulty === difficulty}
                onClick={() => setActiveDifficulty(difficulty)}
                className={cn(
                  'rounded-control px-3 py-1.5 text-[12.5px] transition-colors duration-150',
                  activeDifficulty === difficulty
                    ? 'bg-forest text-ivory-warm'
                    : 'text-ink-muted hover:bg-ink/[0.05] hover:text-ink',
                )}
              >
                {difficulty}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((row) => (
              <div key={row} className="h-72 animate-pulse rounded-card bg-ink/[0.06]" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            tone="error"
            title="Projects unavailable"
            description={error}
            action={
              <Button type="button" variant="secondary" size="sm" onClick={clearFilters}>
                Try again
              </Button>
            }
          />
        ) : projects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No projects found"
            description="Try a different search, or clear the filters to see the full catalogue."
            action={
              <Button type="button" variant="secondary" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        )}
      </div>
    </DashboardLayout>
  );
}
