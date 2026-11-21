import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Eyebrow } from './Badge';

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  action?: ReactNode;
  className?: string;
  titleClassName?: string;
  as?: 'h2' | 'h3';
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  action,
  className,
  titleClassName,
  as: Heading = 'h2',
}: SectionHeadingProps) {
  const centered = align === 'center';
  return (
    <div
      className={cn(
        'flex flex-col gap-6',
        centered && 'items-center text-center',
        action && !centered && 'sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className={cn('max-w-2xl', centered && 'mx-auto')}>
        {eyebrow ? (
          <Eyebrow align={align} className="mb-4">
            {eyebrow}
          </Eyebrow>
        ) : null}
        <Heading
          className={cn(
            'text-balance text-3xl leading-tight tracking-[-0.02em] text-ink sm:text-4xl lg:text-5xl',
            titleClassName,
          )}
        >
          {title}
        </Heading>
        {description ? (
          <p className="mt-4 max-w-[680px] text-pretty text-sm leading-relaxed text-ink-muted sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
