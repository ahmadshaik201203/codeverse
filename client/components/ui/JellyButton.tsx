import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Jelly Button — derived from Uiverse.io "horrible-husky-70" by
 * vinodjangid07 (Vinod Jangid), MIT License. Original CSS: a purple pill
 * with inset gloss shadows, ::before/::after highlight lines and a
 * `jello-horizontal` hover animation. Recolored to the CodeVerse palette:
 * forest green base (#536B58), warm ivory text (#F4F2ED), sage highlights.
 * The jello keyframes and gloss lines are preserved verbatim.
 */
type Shared = {
  children: ReactNode;
  fullWidth?: boolean;
  className?: string;
};

type AsButton = Shared &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & { href?: undefined };

type AsLink = Shared &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children' | 'href'> & { href: string };

export type JellyButtonProps = AsButton | AsLink;

export function JellyButton(props: JellyButtonProps) {
  const { children, fullWidth, className } = props;
  const classes = cn('cv-jelly', fullWidth && 'cv-jelly--full', className);

  const rest: Record<string, unknown> = { ...props };
  delete rest.children;
  delete rest.fullWidth;
  delete rest.className;

  if ('href' in props && typeof props.href === 'string') {
    const { href } = props;
    delete rest.href;
    return (
      <Link href={href} className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </Link>
    );
  }

  delete rest.href;
  return (
    <button className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
