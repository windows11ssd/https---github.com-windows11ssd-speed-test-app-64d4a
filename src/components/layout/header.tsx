
"use client";

import Link from 'next/link';
import LanguageSwitcher from '@/components/language-switcher';
import { Zap } from 'lucide-react';

export default function AppHeader() {
  // const { t } = useLanguage(); // t('appName') is not used for the styled name directly here

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity">
          <Zap className="w-7 h-7 text-primary" />
          <span className="inline-block">
            <span className="text-primary">KSA</span><span className="text-accent">test</span>
          </span>
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
