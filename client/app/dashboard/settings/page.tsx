'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Gauge, Waves } from 'lucide-react';

/**
 * Settings — preferences are stored on this device (localStorage) and take
 * effect immediately; there is no account-level settings API, so nothing
 * here pretends to sync. Each switch drives a real behaviour:
 *  - Reduce motion mirrors the OS reduced-motion media query via
 *    `data-motion="reduced"` on <html> (see globals.css).
 *  - Smooth scrolling starts/stops the Lenis layer (see SmoothScroll).
 */
const MOTION_KEY = 'cv:reduce-motion';
const SCROLL_KEY = 'cv:smooth-scroll';

function applyMotion(reduced: boolean) {
  document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
  window.localStorage.setItem(MOTION_KEY, reduced ? 'on' : 'off');
}

function applySmoothScroll(enabled: boolean) {
  window.localStorage.setItem(SCROLL_KEY, enabled ? 'on' : 'off');
  window.dispatchEvent(new CustomEvent<boolean>('cv:smooth-scroll', { detail: enabled }));
}

function PreferenceRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  statusOn,
  statusOff,
}: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  statusOn: string;
  statusOff: string;
}) {
  return (
    <div className="flex items-center justify-between gap-5 py-5">
      <div className="flex min-w-0 items-start gap-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-forest/25 bg-forest/[0.07] text-forest">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-ink">{title}</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{description}</p>
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-forest">
            {checked ? statusOn : statusOff}
          </p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
    </div>
  );
}

export default function SettingsPage() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [smoothScroll, setSmoothScroll] = useState(true);

  useEffect(() => {
    const motion = window.localStorage.getItem(MOTION_KEY) === 'on';
    const scroll = window.localStorage.getItem(SCROLL_KEY) !== 'off';
    setReduceMotion(motion);
    setSmoothScroll(scroll);
    applyMotion(motion);
    applySmoothScroll(scroll);
  }, []);

  const onMotion = (next: boolean) => {
    setReduceMotion(next);
    applyMotion(next);
  };

  const onScroll = (next: boolean) => {
    setSmoothScroll(next);
    applySmoothScroll(next);
  };

  return (
    <DashboardLayout>
      <div className="space-y-7">
        <PageHeader
          eyebrow="Settings"
          title="Preferences"
          description="Motion and scrolling preferences for this device. Changes apply immediately."
        />

        <Card className="divide-y divide-ink/10 px-6 py-1">
          <PreferenceRow
            icon={Gauge}
            title="Reduce motion"
            description="Calms animations and transitions across the site, same as your operating system's reduced-motion setting."
            checked={reduceMotion}
            onChange={onMotion}
            statusOn="Motion reduced"
            statusOff="Motion full"
          />
          <PreferenceRow
            icon={Waves}
            title="Smooth scrolling"
            description="Glides page scrolling with momentum instead of jumping directly to the new position."
            checked={smoothScroll}
            onChange={onScroll}
            statusOn="Smooth scrolling on"
            statusOff="Smooth scrolling off"
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
