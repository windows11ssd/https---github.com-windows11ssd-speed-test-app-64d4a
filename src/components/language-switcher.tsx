"use client";

import { useLanguage } from '@/contexts/language-context';
import type { Locale } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Languages } from 'lucide-react';

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (newLang: Locale) => {
    setLanguage(newLang);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label={t('language')}>
          <Languages className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={language === 'ar' ? "start" : "end"}>
        <DropdownMenuItem onClick={() => handleLanguageChange('en')} disabled={language === 'en'}>
          {t('english')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLanguageChange('ar')} disabled={language === 'ar'}>
          {t('arabic')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
