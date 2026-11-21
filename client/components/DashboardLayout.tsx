'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import {
  Activity,
  Bell,
  Bot,
  Briefcase,
  ChevronDown,
  Compass,
  FileText,
  FolderGit2,
  FolderOpen,
  Home,
  LogOut,
  Map,
  Menu,
  Mic2,
  Search,
  Settings,
  Shield,
  Terminal,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const sidebarLinks = [
  { group: 'Overview', items: [{ name: 'Dashboard', href: '/dashboard', icon: Home }] },
  {
    group: 'Explore',
    items: [
      { name: 'Domains', href: '/dashboard/domains', icon: Compass },
      { name: 'Projects', href: '/dashboard/projects', icon: FolderGit2 },
      { name: 'Leaderboard', href: '/dashboard/leaderboard', icon: Trophy },
      { name: 'Community', href: '/dashboard/community', icon: Users },
      { name: 'Analytics', href: '/dashboard/analytics', icon: Activity },
      { name: 'Admin portal', href: '/dashboard/admin', icon: Shield },
    ],
  },
  {
    group: 'My journey',
    items: [
      { name: 'My projects', href: '/dashboard/my-projects', icon: FolderOpen },
      { name: 'Active roadmap', href: '/dashboard/roadmap', icon: Map },
    ],
  },
  {
    group: 'AI tools',
    items: [
      { name: 'AI mentor', href: '/dashboard/mentor', icon: Bot },
      { name: 'Skill gap', href: '/dashboard/skills', icon: Activity },
      { name: 'Mock interview', href: '/dashboard/interview', icon: Mic2 },
      { name: 'Resume analyser', href: '/dashboard/resume', icon: FileText },
      { name: 'Job readiness', href: '/dashboard/readiness', icon: Briefcase },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        setProfileDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    router.replace('/login');
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-ink/10 px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5" aria-label="CodeVerse dashboard">
          <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-forest text-ivory-warm">
            <Terminal className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-serif text-[19px] tracking-[-0.02em] text-ink">
            Code<span className="text-forest">Verse</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-control text-ink-muted hover:bg-ink/[0.06] md:hidden"
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav aria-label="Dashboard" className="flex-1 overflow-y-auto px-3 py-5">
        {sidebarLinks.map((group) => (
          <div key={group.group} className="mb-6 last:mb-0">
            <h2 className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
              {group.group}
            </h2>
            <ul className="space-y-0.5">
              {group.items
                // UX only: the server independently enforces admin access.
                .filter((item) => (item.href === '/dashboard/admin' ? user?.role === 'admin' : true))
                .map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'group relative flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-[13px] transition-colors duration-150',
                          active
                            ? 'bg-forest/[0.09] font-medium text-forest-deep'
                            : 'text-ink-muted hover:bg-ink/[0.045] hover:text-ink',
                        )}
                      >
                        {active ? (
                          <span
                            aria-hidden="true"
                            className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-forest"
                          />
                        ) : null}
                        <Icon
                          className={cn('h-4 w-4 shrink-0', active ? 'text-forest' : 'text-ink-faint')}
                          aria-hidden="true"
                        />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-ink/10 p-3">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-[13px] text-ink-muted transition-colors hover:bg-ink/[0.045] hover:text-ink"
        >
          <Settings className="h-4 w-4 text-ink-faint" aria-hidden="true" />
          Settings
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-left text-[13px] text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger-tint)]"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <ProtectedRoute requireOnboarded={true}>
      <div className="flex min-h-screen text-ink">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 border-r border-ink/10 bg-ivory-warm/70 backdrop-blur-md md:block">
          {sidebar}
        </aside>

        {/* Mobile drawer */}
        {mobileMenuOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
            />
            <div className="absolute inset-y-0 left-0 w-[280px] border-r border-ink/10 bg-ivory-warm shadow-lift">
              {sidebar}
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile header */}
          <div className="sticky top-0 z-40 flex h-[60px] items-center justify-between border-b border-ink/10 bg-ivory-warm/85 px-4 backdrop-blur-md md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
              aria-expanded={mobileMenuOpen}
              className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-ink/12 text-ink"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-serif text-[17px] tracking-[-0.02em] text-ink">
              Code<span className="text-forest">Verse</span>
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/12 text-[11px] font-medium text-forest">
              {user?.fullName?.charAt(0) || 'U'}
            </span>
          </div>

          {/* Desktop top bar */}
          <header className="sticky top-0 z-30 hidden h-[68px] shrink-0 items-center justify-between gap-6 border-b border-ink/10 bg-ivory-warm/70 px-8 backdrop-blur-md md:flex">
            <div className="relative w-full max-w-sm">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Search projects, domains, concepts…"
                aria-label="Search CodeVerse"
                className="control h-10 pl-9 text-[13px]"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Notifications"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-ink/[0.05] hover:text-ink"
              >
                <Bell className="h-[18px] w-[18px]" />
                <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-forest" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen((open) => !open)}
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2.5 rounded-control border border-transparent px-1.5 py-1 transition-colors hover:border-ink/12 hover:bg-ivory-warm/70"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-forest/25 bg-forest/[0.08] text-[12px] font-medium text-forest-deep">
                    {user?.fullName?.charAt(0) || 'U'}
                  </span>
                  <span className="hidden flex-col items-start lg:flex">
                    <span className="text-[12.5px] font-medium leading-tight text-ink">
                      {user?.fullName?.split(' ')[0] || 'Engineer'}
                    </span>
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-faint">
                      {user?.careerGoal || 'Engineer'}
                    </span>
                  </span>
                  <ChevronDown className="hidden h-3.5 w-3.5 text-ink-faint lg:block" aria-hidden="true" />
                </button>

                {profileDropdownOpen ? (
                  <div
                    role="menu"
                    className="surface-strong absolute right-0 mt-2 w-56 overflow-hidden rounded-card p-1.5"
                  >
                    <div className="border-b border-ink/10 px-3 py-2.5">
                      <p className="truncate text-[13px] font-medium text-ink">{user?.fullName}</p>
                      <p className="truncate text-[11.5px] text-ink-faint">{user?.email}</p>
                    </div>
                    <Link
                      href="/dashboard/settings"
                      role="menuitem"
                      className="mt-1 flex items-center gap-2 rounded-[6px] px-3 py-2 text-[13px] text-ink-soft hover:bg-ink/[0.05]"
                    >
                      <Settings className="h-4 w-4 text-ink-faint" aria-hidden="true" />
                      Settings
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 rounded-[6px] px-3 py-2 text-left text-[13px] text-[var(--color-danger)] hover:bg-[var(--color-danger-tint)]"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-7 sm:px-6 sm:py-9 lg:px-10">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
