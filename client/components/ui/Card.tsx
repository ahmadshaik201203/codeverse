import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: 'default' | 'strong' | 'quiet' | 'sunken';
  interactive?: boolean;
  children: ReactNode;
};

const tones = {
  default: 'surface',
  strong: 'surface-strong',
  quiet: 'surface-quiet',
  sunken: 'border border-ink/10 bg-[var(--color-surface-sunken)]',
};

export function Card({ tone = 'default', interactive, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card',
        tones[tone],
        interactive &&
          'transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-lift',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
