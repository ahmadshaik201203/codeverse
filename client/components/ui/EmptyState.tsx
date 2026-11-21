import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  tone?: 'neutral' | 'error';
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = 'neutral',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-dashed px-6 py-12 text-center',
        tone === 'error' ? 'border-[var(--color-danger)]/35 bg-[var(--color-danger-tint)]' : 'border-ink/15 bg-ivory-warm/45',
        className,
      )}
    >
      {Icon ? (
        <span
          className={cn(
            'mb-4 flex h-11 w-11 items-center justify-center rounded-full border',
            tone === 'error'
              ? 'border-[var(--color-danger)]/30 text-[var(--color-danger)]'
              : 'border-ink/12 text-forest',
          )}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
      <h3 className="text-lg tracking-[-0.01em] text-ink">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
