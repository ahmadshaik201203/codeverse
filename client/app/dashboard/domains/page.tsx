'use client';

import React, { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import DomainCard, { DomainData } from '@/components/DomainCard';
import { apiFetch, ApiError } from '@/lib/api';
import { Compass, RefreshCw, Search } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/cn';

const categories = ['All', 'AI', 'Data', 'Development'];

export default function DomainsListingPage() {
  const [domains, setDomains] = useState<DomainData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [category, setCategory] = useState<string>('All');
  const [search, setSearch] = useState<string>('');

  const loadDomains = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<{ domains: DomainData[] }>('/domains');
      setDomains(res.domains ?? []);
    } catch (err) {
      setDomains([]);
      setError(err instanceof ApiError ? err.message : 'Could not load domains.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDomains();
  }, [loadDomains]);

  const filteredDomains = domains.filter((domain) => {
    const query = search.toLowerCase();
    const matchesCategory = category === 'All' || domain.category === category;
    const matchesSearch =
      domain.name.toLowerCase().includes(query) ||
      domain.description.toLowerCase().includes(query) ||
      domain.technologies.some((tech) => tech.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-7">
        <PageHeader
          eyebrow="Engineering tracks"
          title="Explore domains"
          description="Open a domain to inspect its curriculum, required technologies and project roadmaps."
        />

        <div className="flex flex-col gap-4 border-b border-ink/10 pb-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by category">
            {categories.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={category === option}
                onClick={() => setCategory(option)}
                className={cn(
                  'rounded-control px-3.5 py-2 text-[12.5px] transition-colors duration-150',
                  category === option
                    ? 'bg-forest text-ivory-warm'
                    : 'text-ink-muted hover:bg-ink/[0.05] hover:text-ink',
                )}
              >
                {option === 'All' ? 'All tracks' : option}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
              aria-hidden="true"
            />
            <label htmlFor="domain-search" className="sr-only">
              Search domains
            </label>
            <input
              id="domain-search"
              type="search"
              placeholder="Search technologies, skills…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-control border border-ink/15 bg-ivory-warm/60 pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-faint focus:border-forest/60 focus:bg-ivory-warm focus:outline-none focus:ring-2 focus:ring-forest/15"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((row) => (
              <div key={row} className="h-56 animate-pulse rounded-card bg-ink/[0.06]" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            tone="error"
            icon={Compass}
            title="Domains could not be loaded"
            description={error}
            action={
              <Button type="button" variant="secondary" size="sm" onClick={loadDomains}>
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Retry
              </Button>
            }
          />
        ) : filteredDomains.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDomains.map((domain) => (
              <DomainCard key={domain.slug} domain={domain} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Compass}
            title={domains.length === 0 ? 'No domains published yet' : 'No matching domains'}
            description={
              domains.length === 0
                ? 'The domain catalogue is empty right now.'
                : 'Adjust the category filter or try a different search term.'
            }
            action={
              domains.length > 0 ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setCategory('All');
                    setSearch('');
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        )}
      </div>
    </DashboardLayout>
  );
}
