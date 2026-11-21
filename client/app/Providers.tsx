'use client';

import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import GlobalAiCopilot from '@/components/GlobalAiCopilot';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <GlobalAiCopilot />
    </AuthProvider>
  );
}
