"use client";

import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';
import LanguageSwitcher from '@/components/language-switcher';
import { Zap } from 'lucide-react';

export default function AppHeader() {
  const { t } = useLanguage();

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary hover:opacity-80 transition-opacity">
          <Zap className="w-7 h-7" />
          <span>{t('appName')}</span>
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
