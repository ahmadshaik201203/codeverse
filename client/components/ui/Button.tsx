import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'quiet' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex select-none items-center justify-center gap-2 rounded-control font-semibold tracking-[-0.005em] transition-[background-color,border-color,color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-ivory-warm active:translate-y-px disabled:pointer-events-none disabled:opacity-45';

const variants: Record<Variant, string> = {
  primary:
    'bg-forest text-ivory-warm shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_24px_-14px_rgba(37,40,39,0.7)] hover:bg-forest-deep active:translate-y-px',
  secondary:
    'border border-ink/20 bg-ivory-warm/60 text-ink hover:border-ink/35 hover:bg-ivory-warm/90 active:translate-y-px',
  ghost: 'text-ink-soft hover:bg-ink/[0.06] hover:text-ink',
  quiet: 'px-0 text-forest underline-offset-4 hover:text-forest-deep hover:underline',
  danger: 'bg-[var(--color-danger)] text-ivory-warm hover:brightness-110',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-sm',
};

const quietSizes: Record<Size, string> = {
  sm: 'h-8 text-xs',
  md: 'h-10 text-sm',
  lg: 'h-11 text-sm',
};

type Shared = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  fullWidth?: boolean;
};

type AsButton = Shared &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & { href?: undefined };

type AsLink = Shared &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children' | 'href'> & { href: string };

export type ButtonProps = AsButton | AsLink;

export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', className, children, fullWidth } = props;
  const classes = cn(
    base,
    variant === 'quiet' ? quietSizes[size] : sizes[size],
    variants[variant],
    fullWidth && 'w-full',
    className,
  );

  const rest: Record<string, unknown> = { ...props };
  delete rest.variant;
  delete rest.size;
  delete rest.className;
  delete rest.children;
  delete rest.fullWidth;

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
