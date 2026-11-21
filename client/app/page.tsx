import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Tagline from '@/components/Tagline';
import HowItWorks from '@/components/HowItWorks';
import Domains from '@/components/Domains';
import Features from '@/components/Features';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col text-ink">
      <Navbar />
      <Hero />
      <About />
      <Tagline />
      <HowItWorks />
      <Domains />
      <Features />
      {/*
        Team / "Our Team" section intentionally not rendered (2026-11-12).
        The component and its card are kept intact so a real team section can
        be restored by importing Team and placing <Team /> between <Features />
        and <CTA />, plus re-adding the '#team' entry in Navbar/Footer.
        See components/Team.tsx.
      */}
      <CTA />
      <Footer />
    </main>
  );
}
