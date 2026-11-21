'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import {
  ArrowLeft,
  ArrowRight,
  BarChart,
  Brain,
  Check,
  Cloud,
  Code2,
  Database,
  Layers,
  Shield,
  Smartphone,
  Terminal,
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { Spinner } from '@/components/ui/Spinner';

const careerOptions = [
  { title: 'Full Stack Developer', icon: Code2, desc: 'Modern web applications from frontend to database' },
  { title: 'AI/ML Engineer', icon: Brain, desc: 'Neural networks, generative models and LLM pipelines' },
  { title: 'Data Scientist', icon: Database, desc: 'Advanced analytics, predictive modelling and statistics' },
  { title: 'Data Analyst', icon: BarChart, desc: 'Business intelligence, dashboards and decision support' },
  { title: 'Mobile Developer', icon: Smartphone, desc: 'Cross-platform and native iOS/Android applications' },
  { title: 'Cloud/DevOps Engineer', icon: Cloud, desc: 'CI/CD, Kubernetes, cloud infrastructure and reliability' },
  { title: 'Cybersecurity Engineer', icon: Shield, desc: 'Application security, penetration testing and defence' },
  { title: 'Other', icon: Layers, desc: 'A custom engineering trajectory' },
];

const experienceOptions = [
  { level: 'Beginner', desc: 'Little to no production coding experience. Learning the basics and core concepts.' },
  { level: 'Intermediate', desc: 'Comfortable with syntax, built small projects, ready for architecture.' },
  { level: 'Advanced', desc: 'Built multi-service apps, familiar with production deployment and design.' },
];

const techOptions = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust',
  'React', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot',
  'HTML/CSS', 'Tailwind CSS', 'MongoDB', 'PostgreSQL', 'MySQL', 'Docker',
  'Git/GitHub', 'AWS', 'PyTorch', 'TensorFlow', 'Pandas/NumPy',
];

const languageOptions = ['English', 'Hindi', 'Spanish', 'French', 'German', 'Bengali', 'Telugu', 'Tamil'];

const stepTitles = [
  { eyebrow: 'Goal', title: 'What do you want to become?' },
  { eyebrow: 'Level', title: 'Where are you starting from?' },
  { eyebrow: 'Toolbox', title: 'What have you already used?' },
  { eyebrow: 'Language', title: 'How should the mentor explain things?' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [careerGoal, setCareerGoal] = useState<string>('Full Stack Developer');
  const [experienceLevel, setExperienceLevel] = useState<string>('Beginner');
  const [knownTechnologies, setKnownTechnologies] = useState<string[]>(['JavaScript', 'HTML/CSS']);
  const [learningLanguage, setLearningLanguage] = useState<string>('English');

  const toggleTechnology = (tech: string) => {
    setKnownTechnologies((current) =>
      current.includes(tech) ? current.filter((item) => item !== tech) : [...current, tech],
    );
  };

  const handleFinish = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/auth/onboard', {
        method: 'POST',
        body: JSON.stringify({ careerGoal, experienceLevel, knownTechnologies, learningLanguage }),
      });

      if (res.user) {
        updateUser(res.user);
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const current = stepTitles[step - 1];

  return (
    <ProtectedRoute>
      <main className="min-h-screen px-5 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-forest text-ivory-warm">
                <Terminal className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="font-serif text-[19px] tracking-[-0.02em] text-ink">
                Code<span className="text-forest">Verse</span>
              </span>
            </span>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-faint">
              Step {step} of 4
            </span>
          </div>

          <div className="mt-8 h-px w-full bg-ink/10">
            <div
              className="h-px bg-forest transition-[width] duration-500 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>

          <div className="mt-10">
            <p className="eyebrow">{current.eyebrow}</p>
            <h1 className="mt-4 font-serif text-[clamp(1.9rem,4vw,2.6rem)] leading-tight tracking-[-0.03em] text-ink">
              {step === 1 && user?.fullName
                ? `Welcome, ${user.fullName.split(' ')[0]}. What do you want to become?`
                : current.title}
            </h1>
            <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-ink-muted">
              {step === 1 && 'This sets the domain and blueprint family suggested to you.'}
              {step === 2 && 'Blueprint complexity and mentor explanations adapt to this.'}
              {step === 3 && 'Select every language, tool or framework you have used.'}
              {step === 4 && 'Choose the language you prefer for AI mentor explanations.'}
            </p>
          </div>

          <div className="surface mt-8 rounded-panel p-5 sm:p-7">
            {error ? (
              <div
                role="alert"
                className="mb-6 rounded-control border border-[var(--color-danger)]/30 bg-[var(--color-danger-tint)] px-3.5 py-3 text-[12.5px] text-[var(--color-danger)]"
              >
                {error}
              </div>
            ) : null}

            {step === 1 ? (
              <div role="radiogroup" aria-label="Career goal" className="grid gap-2.5 sm:grid-cols-2">
                {careerOptions.map((option) => {
                  const Icon = option.icon;
                  const selected = careerGoal === option.title;
                  return (
                    <button
                      key={option.title}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setCareerGoal(option.title)}
                      className={cn(
                        'flex items-start gap-3 rounded-control border p-4 text-left transition-colors duration-200',
                        selected
                          ? 'border-forest/45 bg-forest/[0.07]'
                          : 'border-ink/12 bg-ivory-warm/50 hover:border-ink/25 hover:bg-ivory-warm/80',
                      )}
                    >
                      <Icon
                        className={cn('mt-0.5 h-4 w-4 shrink-0', selected ? 'text-forest' : 'text-ink-faint')}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block text-[13.5px] font-medium text-ink">{option.title}</span>
                        <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-muted">
                          {option.desc}
                        </span>
                      </span>
                      {selected ? <Check className="ml-auto h-4 w-4 shrink-0 text-forest" aria-hidden="true" /> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {step === 2 ? (
              <div role="radiogroup" aria-label="Experience level" className="space-y-2.5">
                {experienceOptions.map((option) => {
                  const selected = experienceLevel === option.level;
                  return (
                    <button
                      key={option.level}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setExperienceLevel(option.level)}
                      className={cn(
                        'flex w-full items-start justify-between gap-4 rounded-control border p-5 text-left transition-colors duration-200',
                        selected
                          ? 'border-forest/45 bg-forest/[0.07]'
                          : 'border-ink/12 bg-ivory-warm/50 hover:border-ink/25 hover:bg-ivory-warm/80',
                      )}
                    >
                      <span>
                        <span className="block font-serif text-[17px] text-ink">{option.level}</span>
                        <span className="mt-1 block text-[12.5px] leading-relaxed text-ink-muted">
                          {option.desc}
                        </span>
                      </span>
                      {selected ? <Check className="mt-1 h-4 w-4 shrink-0 text-forest" aria-hidden="true" /> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {step === 3 ? (
              <div>
                <div className="flex flex-wrap gap-2">
                  {techOptions.map((tech) => {
                    const selected = knownTechnologies.includes(tech);
                    return (
                      <button
                        key={tech}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleTechnology(tech)}
                        className={cn(
                          'rounded-full border px-3 py-1.5 font-mono text-[11.5px] transition-colors duration-150',
                          selected
                            ? 'border-forest/50 bg-forest/[0.1] text-forest-deep'
                            : 'border-ink/12 bg-ivory-warm/50 text-ink-muted hover:border-ink/25 hover:text-ink',
                        )}
                      >
                        {tech}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-faint">
                  {knownTechnologies.length} selected
                </p>
              </div>
            ) : null}

            {step === 4 ? (
              <div role="radiogroup" aria-label="Learning language" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {languageOptions.map((language) => {
                  const selected = learningLanguage === language;
                  return (
                    <button
                      key={language}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setLearningLanguage(language)}
                      className={cn(
                        'rounded-control border px-4 py-3 text-center text-[13px] font-medium transition-colors duration-200',
                        selected
                          ? 'border-forest/45 bg-forest/[0.08] text-forest-deep'
                          : 'border-ink/12 bg-ivory-warm/50 text-ink-soft hover:border-ink/25',
                      )}
                    >
                      {language}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="mt-7 flex items-center justify-between gap-4">
            {step > 1 ? (
              <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </Button>
            ) : (
              <span />
            )}

            {step < 4 ? (
              <Button type="button" onClick={() => setStep(step + 1)}>
                Continue
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button type="button" onClick={handleFinish} disabled={loading}>
                {loading ? (
                  <>
                    <Spinner label="Saving profile" />
                    Saving…
                  </>
                ) : (
                  <>
                    Finish and open dashboard
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
