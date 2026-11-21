'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { Activity, LineChart, RefreshCw, Zap } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';

interface SummaryData {
  totalXp: number;
  level: number;
  currentStreakDays: number;
  projectsCompleted: number;
  totalAvailableProjects: number;
  completionRate: number;
  weeklyActivity: Array<{ day: string; commits: number; tasks: number }>;
  weeklyActivityAvailable: boolean;
}

interface SkillRadarItem {
  subject: string;
  score: number;
  fullMark: number;
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [skills, setSkills] = useState<SkillRadarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryData, radarData] = await Promise.all([
        apiFetch<{ summary: SummaryData }>('/analytics/summary'),
        apiFetch<{ skills: SkillRadarItem[] }>('/analytics/radar'),
      ]);
      setSummary(summaryData.summary);
      setSkills(radarData.skills ?? []);
    } catch (err) {
      setSummary(null);
      setSkills([]);
      setError(err instanceof ApiError ? err.message : 'Could not load your analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const metrics = [
    { label: 'Projects completed', value: summary?.projectsCompleted ?? 0 },
    { label: 'Active streak', value: `${summary?.currentStreakDays ?? 0}d` },
    { label: 'Total XP', value: summary?.totalXp ?? 0 },
    { label: 'Level', value: summary?.level ?? 1 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-7">
        <PageHeader
          eyebrow="Progress"
          title="Engineering analytics"
          description="Only measured activity appears here — nothing is estimated or inferred."
          actions={<Badge tone="outline">Measured only</Badge>}
        />

        {error ? (
          <EmptyState
            tone="error"
            icon={LineChart}
            title="Analytics unavailable"
            description={error}
            action={
              <Button type="button" variant="secondary" size="sm" onClick={load}>
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Retry
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {metrics.map((metric) => (
                <Card key={metric.label} className="p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                    {metric.label}
                  </p>
                  <p className="mt-3 font-serif text-[28px] leading-none tracking-[-0.02em] text-ink">
                    {loading ? (
                      <span className="inline-block h-6 w-10 animate-pulse rounded bg-ink/10" />
                    ) : (
                      metric.value
                    )}
                  </p>
                </Card>
              ))}
            </div>

            <section aria-labelledby="proficiency" className="space-y-4">
              <h2
                id="proficiency"
                className="flex items-center gap-2 font-serif text-[20px] tracking-[-0.015em] text-ink"
              >
                <Zap className="h-4 w-4 text-forest" aria-hidden="true" />
                Technical proficiency
              </h2>

              {loading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4].map((row) => (
                    <div key={row} className="h-20 animate-pulse rounded-card bg-ink/[0.06]" />
                  ))}
                </div>
              ) : skills.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {skills.map((skill) => (
                    <Card key={skill.subject} className="p-5">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-[13px] font-medium text-ink">{skill.subject}</span>
                        <span className="font-mono text-[11px] text-forest">
                          {skill.score} / {skill.fullMark}
                        </span>
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
                  description="Scores are added once submitted work has been evaluated."
                />
              )}
            </section>

            <Card className="p-6">
              <h2 className="flex items-center gap-2 font-serif text-[19px] tracking-[-0.01em] text-ink">
                <Activity className="h-4 w-4 text-forest" aria-hidden="true" />
                Weekly activity
              </h2>

              <div className="mt-5">
                {loading ? (
                  <div className="grid grid-cols-7 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                      <div key={day} className="h-24 animate-pulse rounded-control bg-ink/[0.06]" />
                    ))}
                  </div>
                ) : summary && summary.weeklyActivity.length > 0 ? (
                  <div className="grid grid-cols-7 gap-2">
                    {summary.weeklyActivity.map((activity) => (
                      <div
                        key={activity.day}
                        className="rounded-control border border-ink/10 bg-ivory-warm/50 p-3 text-center"
                      >
                        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                          {activity.day}
                        </p>
                        <p className="mt-2 font-serif text-[19px] leading-none text-ink">{activity.commits}</p>
                        <p className="mt-1 text-[9.5px] uppercase tracking-[0.08em] text-ink-faint">Commits</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No daily activity recorded yet"
                    description="Per-day tracking is not connected to a data source yet, so nothing is shown rather than estimated."
                    className="py-10"
                  />
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
