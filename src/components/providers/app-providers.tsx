'use client';

import { ReactNode } from 'react';
import { LanguageProvider } from '@/lib/i18n';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  );
}
