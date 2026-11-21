'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, ApiError } from '@/lib/api';
import { Award, Crown, Flame, RefreshCw, Trophy, Users } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

interface LeaderboardUser {
  rank: number;
  id: string;
  fullName: string;
  username: string;
  college: string;
  department: string;
  xp: number;
  level: number;
  streak: number;
  badgeCount: number;
}

const xpRules = [
  { xp: '25', label: 'Per sandbox run' },
  { xp: '100', label: 'Task verified' },
  { xp: '75', label: 'Full code review' },
  { xp: '30', label: 'Blueprint explored' },
];

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<{ leaderboard: LeaderboardUser[] }>('/gamification/leaderboard');
      setLeaderboard(data.leaderboard ?? []);
    } catch (err) {
      setLeaderboard([]);
      setError(err instanceof ApiError ? err.message : 'Could not load the leaderboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <DashboardLayout>
      <div className="space-y-7">
        <PageHeader
          eyebrow="Rankings"
          title="Campus engineering leaderboard"
          description="Ranked by XP earned from verified work — nothing is awarded for time spent."
          actions={<Badge tone="sage">XP rankings</Badge>}
        />

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-ink/10 bg-ink/10 sm:grid-cols-4">
          {xpRules.map((rule) => (
            <div key={rule.label} className="bg-ivory-warm/70 px-4 py-4">
              <p className="font-serif text-[22px] leading-none tracking-[-0.02em] text-ink">{rule.xp}</p>
              <p className="mt-1.5 text-[10.5px] uppercase tracking-[0.12em] text-ink-faint">{rule.label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((row) => (
              <div key={row} className="h-16 animate-pulse rounded-card bg-ink/[0.06]" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            tone="error"
            icon={Trophy}
            title="Rankings unavailable"
            description={error}
            action={
              <Button type="button" variant="secondary" size="sm" onClick={load}>
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Retry
              </Button>
            }
          />
        ) : leaderboard.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No rankings yet"
            description="The leaderboard fills as students earn XP from verified work."
          />
        ) : (
          <>
            {leaderboard.length >= 3 ? (
              <div className="grid gap-4 md:grid-cols-3">
                {[leaderboard[1], leaderboard[0], leaderboard[2]].map((person, index) => {
                  const first = index === 1;
                  return (
                    <Card
                      key={person.id}
                      tone={first ? 'strong' : 'default'}
                      className={`p-6 text-center ${first ? 'order-first md:order-none md:-mt-2 md:pb-8' : ''}`}
                    >
                      <div className="flex items-center justify-center">
                        {first ? (
                          <Crown className="h-5 w-5 text-forest" aria-hidden="true" />
                        ) : (
                          <span className="font-mono text-[11px] text-ink-faint">Rank {person.rank}</span>
                        )}
                      </div>
                      <p className="mt-3 font-serif text-[19px] leading-snug tracking-[-0.01em] text-ink">
                        {person.fullName}
                      </p>
                      <p className="mt-1 text-[11.5px] text-ink-faint">{person.college || 'College not listed'}</p>
                      <div className="mt-4 flex items-center justify-center gap-4 border-t border-ink/10 pt-3 font-mono text-[11px] text-ink-soft">
                        <span>{person.xp} XP</span>
                        <span className="text-ink-faint">·</span>
                        <span>Level {person.level}</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : null}

            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
                <h2 className="flex items-center gap-2 font-serif text-[18px] tracking-[-0.01em] text-ink">
                  <Users className="h-4 w-4 text-forest" aria-hidden="true" />
                  Global standings
                </h2>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-faint">
                  {leaderboard.length} {leaderboard.length === 1 ? 'engineer' : 'engineers'}
                </span>
              </div>

              <ul className="divide-y divide-ink/10">
                {leaderboard.map((person) => (
                  <li
                    key={person.id}
                    className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-ivory-warm/50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="w-6 shrink-0 text-center font-mono text-[11px] text-ink-faint">
                        {person.rank}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/portfolio/${person.username}`}
                            className="truncate text-[13.5px] font-medium text-ink underline-offset-4 hover:text-forest hover:underline"
                          >
                            {person.fullName}
                          </Link>
                          <Badge tone="outline">Level {person.level}</Badge>
                        </div>
                        <p className="truncate text-[11.5px] text-ink-faint">
                          {person.college || '—'} · {person.department || '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-5 pl-10 font-mono text-[11px] text-ink-soft sm:pl-0">
                      <span className="inline-flex items-center gap-1.5">
                        <Flame className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
                        {person.streak}d
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
                        {person.badgeCount}
                      </span>
                      <span className="w-20 text-right text-ink">{person.xp} XP</span>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
