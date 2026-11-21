import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, Terminal } from 'lucide-react';

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  aside?: ReactNode;
  wide?: boolean;
  /** Hides the page heading block when the form supplies its own heading. */
  bare?: boolean;
};

/**
 * Shared frame for sign-in and registration: an editorial statement on the
 * left, the form on the right. On narrow screens only the form remains.
 */
export function AuthShell({ title, description, children, footer, aside, wide, bare }: AuthShellProps) {
  return (
    <main className="min-h-screen">
      <div className="grid min-h-screen lg:grid-cols-[1.02fr_1fr]">
        <aside className="relative hidden flex-col justify-between border-r border-ink/10 px-12 py-12 lg:flex">
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="CodeVerse home">
            <span className="flex h-9 w-9 items-center justify-center rounded-[7px] bg-forest text-ivory-warm">
              <Terminal className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="font-serif text-[21px] tracking-[-0.02em] text-ink">
              Code<span className="text-forest">Verse</span>
            </span>
          </Link>

          <div className="max-w-md">
            {aside ?? (
              <>
                <p className="eyebrow">Engineering education</p>
                <p className="mt-6 font-serif text-[clamp(1.9rem,2.6vw,2.6rem)] leading-[1.12] tracking-[-0.03em] text-ink">
                  The work you can show
                  <span className="italic text-forest"> matters more than the courses you finish.</span>
                </p>
                <p className="mt-5 text-[14px] leading-relaxed text-ink-muted">
                  Blueprints, mentoring and review, arranged so every milestone leaves you with
                  evidence of engineering ability.
                </p>
              </>
            )}
          </div>

          <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-faint">
            Learn · Build · Practice
          </p>
        </aside>

        <div className="flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-14">
          <div className="mx-auto w-full max-w-md">
            <div className="flex items-center justify-between lg:hidden">
              <Link href="/" className="inline-flex items-center gap-2" aria-label="CodeVerse home">
                <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-forest text-ivory-warm">
                  <Terminal className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="font-serif text-[19px] tracking-[-0.02em] text-ink">
                  Code<span className="text-forest">Verse</span>
                </span>
              </Link>
            </div>

            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-1.5 text-[12.5px] text-ink-faint transition-colors hover:text-ink lg:mt-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Back to CodeVerse
            </Link>

            {bare ? null : (
              <div className={wide ? 'mt-8' : 'mt-8'}>
                <h1 className="font-serif text-[clamp(1.9rem,4vw,2.4rem)] leading-tight tracking-[-0.03em] text-ink">
                  {title}
                </h1>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">{description}</p>
              </div>
            )}

            <div className={bare ? 'mt-6' : 'mt-8'}>{children}</div>

            {footer ? <div className="mt-8 border-t border-ink/10 pt-6">{footer}</div> : null}
          </div>
        </div>
      </div>
    </main>
  );
}
