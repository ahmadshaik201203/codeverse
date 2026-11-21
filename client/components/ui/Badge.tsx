import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type BadgeProps = {
  children: ReactNode;
  tone?: 'sage' | 'forest' | 'ink' | 'outline';
  className?: string;
};

const tones = {
  sage: 'bg-sage-mist text-forest-deep border-forest/20',
  forest: 'bg-forest text-ivory-warm border-forest',
  ink: 'bg-ink text-ivory-warm border-ink',
  outline: 'bg-ivory-warm/50 text-ink-muted border-ink/15',
};

export function Badge({ children, tone = 'sage', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-[0.06em] uppercase',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Eyebrow({
  children,
  align = 'left',
  className,
}: {
  children: ReactNode;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <span className={cn('eyebrow', align === 'center' && 'eyebrow-center justify-center', className)}>
      {children}
    </span>
  );
}
