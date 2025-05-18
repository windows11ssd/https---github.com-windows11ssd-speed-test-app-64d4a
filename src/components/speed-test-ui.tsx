"use client";

import { useState, useEffect, useCallback } from 'react';
import Gauge from '@/components/gauge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { Download, Upload, Zap, RotateCcw, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TestStatus = 'idle' | 'testing-download' | 'testing-upload' | 'testing-ping' | 'finished';

export default function SpeedTestUI() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<TestStatus>('idle');
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [ping, setPing] = useState(0);

  const resetSpeeds = () => {
    setDownloadSpeed(0);
    setUploadSpeed(0);
    setPing(0);
  };

  const runTest = useCallback(async () => {
    setStatus('testing-download');
    resetSpeeds();

    // Simulate download test
    await new Promise(resolve => setTimeout(resolve, 500));
    for (let i = 0; i <= 100; i += 5) {
      setDownloadSpeed(Math.random() * 80 + (i / 100) * 200); // Simulate fluctuating speed up to 200 Mbps
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    setDownloadSpeed(Math.random() * 150 + 50); // Final download speed
    
    setStatus('testing-upload');
    await new Promise(resolve => setTimeout(resolve, 500));
    for (let i = 0; i <= 100; i += 5) {
      setUploadSpeed(Math.random() * 40 + (i / 100) * 80); // Simulate fluctuating speed up to 80 Mbps
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    setUploadSpeed(Math.random() * 60 + 20); // Final upload speed

    setStatus('testing-ping');
    await new Promise(resolve => setTimeout(resolve, 500));
    for (let i = 0; i <= 100; i += 10) {
        setPing(Math.random() * 30 + (100-i)); // Simulate fluctuating ping down to ~10ms
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    setPing(Math.random() * 20 + 8); // Final ping

    setStatus('finished');
  }, []);

  const handleStartTest = () => {
    if (status === 'idle' || status === 'finished') {
      runTest();
    }
  };

  const getButtonText = () => {
    if (status === 'idle') return t('startTest');
    if (status === 'testing-download' || status === 'testing-upload' || status === 'testing-ping') return t('testing');
    if (status === 'finished') return t('startTest'); // Or "Test Again"
    return t('startTest');
  };
  
  const getStatusText = () => {
    switch (status) {
      case 'testing-download':
        return `${t('testing')} ${t('download')}...`;
      case 'testing-upload':
        return `${t('testing')} ${t('upload')}...`;
      case 'testing-ping':
        return `${t('testing')} ${t('ping')}...`;
      case 'finished':
        return t('results');
      default:
        return t('tagline');
    }
  }

  return (
    <div className="flex flex-col items-center space-y-8 py-8">
      <h1 className="text-3xl md:text-4xl font-bold text-center text-primary">{t('appName')}</h1>
      <p className="text-lg text-muted-foreground text-center">{getStatusText()}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <Gauge value={downloadSpeed} maxValue={500} label={t('download')} unit={t('mbps')} />
        <Gauge value={uploadSpeed} maxValue={200} label={t('upload')} unit={t('mbps')} />
        <Gauge value={ping} maxValue={200} label={t('ping')} unit={t('ms')} />
      </div>

      <Button
        size="lg"
        onClick={handleStartTest}
        disabled={status.startsWith('testing')}
        className="min-w-[200px] text-lg py-6 px-8 rounded-full shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl transform hover:scale-105"
      >
        {status.startsWith('testing') ? (
          <RotateCcw className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <Play className="mr-2 h-5 w-5" />
        )}
        {getButtonText()}
      </Button>
    </div>
  );
}
