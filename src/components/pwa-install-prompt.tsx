"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DownloadCloud, X } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Check if app is already installed or banner dismissed previously
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
      const bannerDismissed = localStorage.getItem('pwaInstallDismissed') === 'true';
      if (!isInstalled && !bannerDismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA installation');
    } else {
      console.log('User dismissed the PWA installation');
    }
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismissBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwaInstallDismissed', 'true');
  };

  const getOSInstructions = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return t('installInstructionsIOS');
    }
    if (/android/.test(userAgent)) {
      return t('installInstructionsAndroid');
    }
    return t('installInstructionsOther');
  };

  if (!showInstallBanner || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-center">
      <Card className="w-full max-w-md shadow-xl bg-background border-primary">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg text-primary">{t('installApp')}</CardTitle>
          <Button variant="ghost" size="icon" onClick={handleDismissBanner} aria-label={t('close')}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{getOSInstructions()}</p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleInstallClick} className="w-full">
            <DownloadCloud className="mr-2 h-4 w-4" />
            {t('installApp')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PWAInstallPrompt;
