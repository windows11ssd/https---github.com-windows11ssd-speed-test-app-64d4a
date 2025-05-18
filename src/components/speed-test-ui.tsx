
"use client";

import { useState, useEffect, useCallback } from 'react';
import Gauge from '@/components/gauge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { Download, Upload, Zap, RotateCcw, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";


type TestStatus = 'idle' | 'testing-download' | 'testing-upload' | 'testing-ping' | 'finished';

const fileSizeOptions = [
  { value: 1, label: "1 MB" },
  { value: 5, label: "5 MB" },
  { value: 10, label: "10 MB" },
  { value: 50, label: "50 MB" },
  { value: 100, label: "100 MB" },
  { value: 500, label: "500 MB" },
  { value: 1000, label: "1000 MB" },
];

export default function SpeedTestUI() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<TestStatus>('idle');
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [ping, setPing] = useState(0);
  const [selectedFileSize, setSelectedFileSize] = useState<number>(50);

  const resetSpeeds = () => {
    setDownloadSpeed(0);
    setUploadSpeed(0);
    setPing(0);
  };

  const runTest = useCallback(async (currentFileSize: number) => {
    setStatus('testing-download');
    resetSpeeds();

    let durationMultiplier = 1;
    if (currentFileSize <= 10) durationMultiplier = 0.7;
    else if (currentFileSize < 500) durationMultiplier = 1; // Default for sizes like 50, 100
    else if (currentFileSize >= 500 && currentFileSize < 1000) durationMultiplier = 1.5;
    else if (currentFileSize >= 1000) durationMultiplier = 2.0;


    const baseWait = 500 * durationMultiplier;
    const iterationWait = 50 * durationMultiplier;
    const pingIterationWait = 30 * durationMultiplier;


    // Simulate download test
    await new Promise(resolve => setTimeout(resolve, baseWait));
    for (let i = 0; i <= 100; i += 5) {
      setDownloadSpeed(Math.random() * 80 + (i / 100) * 200 * (currentFileSize / 500 + 0.5) ); // Simulate fluctuating speed up to a varying max based on filesize somewhat
      await new Promise(resolve => setTimeout(resolve, iterationWait));
    }
    setDownloadSpeed(Math.random() * 150 + 50 * (currentFileSize / 500 + 0.5)); // Final download speed
    
    setStatus('testing-upload');
    await new Promise(resolve => setTimeout(resolve, baseWait));
    for (let i = 0; i <= 100; i += 5) {
      setUploadSpeed(Math.random() * 40 + (i / 100) * 80 * (currentFileSize / 500 + 0.5)); // Simulate fluctuating speed up to a varying max
      await new Promise(resolve => setTimeout(resolve, iterationWait));
    }
    setUploadSpeed(Math.random() * 60 + 20 * (currentFileSize / 500 + 0.5)); // Final upload speed

    setStatus('testing-ping');
    await new Promise(resolve => setTimeout(resolve, baseWait)); // Ping test duration also scaled
    for (let i = 0; i <= 100; i += 10) {
        setPing(Math.random() * 30 + (100-i)); 
        await new Promise(resolve => setTimeout(resolve, pingIterationWait));
      }
    setPing(Math.random() * 20 + 8); 

    setStatus('finished');
  }, []);

  const handleStartTest = () => {
    if (status === 'idle' || status === 'finished') {
      runTest(selectedFileSize);
    }
  };

  const getButtonText = () => {
    if (status === 'idle') return t('startTest');
    if (status.startsWith('testing')) return t('testing');
    if (status === 'finished') return t('startTest'); 
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
    <div className="flex flex-col items-center space-y-6 py-8"> {/* Reduced space-y from 8 to 6 */}
      <h1 className="text-3xl md:text-4xl font-bold text-center">
        <span className="text-primary">KSA</span><span className="text-accent">test</span>
      </h1>
      <p className="text-lg text-muted-foreground text-center h-6">{getStatusText()}</p> {/* Added fixed height to prevent layout shift */}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <Gauge value={downloadSpeed} maxValue={500} label={t('download')} unit={t('mbps')} />
        <Gauge value={uploadSpeed} maxValue={200} label={t('upload')} unit={t('mbps')} />
        <Gauge value={ping} maxValue={200} label={t('ping')} unit={t('ms')} />
      </div>

      <div className="w-full max-w-xs space-y-2 mt-4"> {/* Added mt-4 for spacing */}
        <Label htmlFor="file-size-select" className="text-center block">{t('fileSize')}</Label>
        <Select
          value={selectedFileSize.toString()}
          onValueChange={(value) => setSelectedFileSize(Number(value))}
          disabled={status.startsWith('testing')}
        >
          <SelectTrigger id="file-size-select" className="w-full">
            <SelectValue placeholder={t('selectFileSize')} />
          </SelectTrigger>
          <SelectContent>
            {fileSizeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        size="lg"
        onClick={handleStartTest}
        disabled={status.startsWith('testing')}
        className="min-w-[200px] text-lg py-6 px-8 rounded-full shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl transform hover:scale-105 mt-4" // Added mt-4
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
