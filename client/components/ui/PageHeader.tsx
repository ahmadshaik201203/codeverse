import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Eyebrow } from './Badge';

type PageHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/** Consistent page opening for every authenticated surface. */
export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-6 border-b border-ink/10 pb-7 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow ? <Eyebrow className="mb-3">{eyebrow}</Eyebrow> : null}
        <h1 className="text-2xl leading-tight tracking-[-0.02em] text-ink sm:text-[2rem]">{title}</h1>
        {description ? (
          <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  );
}
