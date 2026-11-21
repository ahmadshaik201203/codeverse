import type { Metadata, Viewport } from 'next';
import { Bodoni_Moda } from 'next/font/google';
import './globals.css';
import '@/components/ui/uiverse.css';
import Providers from './Providers';
import GlobalBackground from '@/components/GlobalBackground';
import SmoothScroll from '@/components/SmoothScroll';

/**
 * Global typography: Bodoni Moda (variable font, opsz + wght axes).
 * One family serves the entire site — body text, headings, buttons,
 * forms, cards and code surfaces. `display: 'swap'` with a metric-matched
 * serif fallback keeps the swap free of layout shift.
 */
const bodoniModa = Bodoni_Moda({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bodoni',
  fallback: ['serif'],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: {
    default: 'CodeVerse | Learn. Build. Practice. Get job ready.',
    template: '%s | CodeVerse',
  },
  description:
    'CodeVerse helps college students move from textbook theory to production engineering with AI blueprints, real-world projects and an interactive AI mentor.',
  applicationName: 'CodeVerse',
  keywords: ['engineering education', 'AI mentor', 'project blueprints', 'career readiness'],
  openGraph: {
    title: 'CodeVerse | Learn. Build. Practice.',
    description:
      'Structured AI blueprints, real-world projects and an interactive mentor for students becoming production engineers.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#f4f2ed',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={bodoniModa.variable}>
      <body className="min-h-screen antialiased">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <SmoothScroll />
        <GlobalBackground />
        <div id="main-content" tabIndex={-1} className="contents">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
