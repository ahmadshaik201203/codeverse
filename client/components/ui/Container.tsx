import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type ContainerProps = {
  as?: ElementType;
  size?: 'default' | 'wide' | 'narrow';
  className?: string;
  children: ReactNode;
};

const sizes = {
  narrow: 'max-w-4xl',
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
};

/** One horizontal rhythm for the whole product. */
export function Container({ as: Comp = 'div', size = 'default', className, children }: ContainerProps) {
  return (
    <Comp className={cn('mx-auto w-full px-4 sm:px-8 lg:px-10', sizes[size], className)}>
      {children}
    </Comp>
  );
}
