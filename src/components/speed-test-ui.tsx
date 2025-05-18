
"use client";

import { useState, useEffect, useCallback } from 'react';
import Gauge from '@/components/gauge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { Play, RotateCcw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from 'lucide-react';

type TestStatus = 'idle' | 'testing-download' | 'testing-upload' | 'testing-ping' | 'finished' | 'error';

const fileSizeOptions = [
  { value: 1, label: "1 MB" },
  { value: 5, label: "5 MB" },
  { value: 10, label: "10 MB" },
  { value: 50, label: "50 MB" },
  { value: 100, label: "100 MB" },
  { value: 500, label: "500 MB" },
  { value: 1000, label: "1000 MB" },
];

const DOWNLOAD_BASE_URL = "https://proof.platform.athena.com/files/";
const UPLOAD_URL = "https://httpbin.org/post"; // Public endpoint that echoes POST data
const PING_URL_BASE = "https://proof.platform.athena.com/files/1KB.bin"; // Small file for ping

// Helper to get appropriate download file and iteration count
const getDownloadFileConfig = (selectedSizeMB: number): { url: string, iterations: number, actualSizeMBPerIteration: number } => {
  if (selectedSizeMB <= 1) return { url: `${DOWNLOAD_BASE_URL}1MB.bin`, iterations: 1, actualSizeMBPerIteration: 1 };
  if (selectedSizeMB <= 5) return { url: `${DOWNLOAD_BASE_URL}5MB.bin`, iterations: 1, actualSizeMBPerIteration: 5 };
  if (selectedSizeMB <= 10) return { url: `${DOWNLOAD_BASE_URL}10MB.bin`, iterations: 1, actualSizeMBPerIteration: 10 };
  if (selectedSizeMB <= 50) return { url: `${DOWNLOAD_BASE_URL}50MB.bin`, iterations: 1, actualSizeMBPerIteration: 50 };
  if (selectedSizeMB <= 100) return { url: `${DOWNLOAD_BASE_URL}100MB.bin`, iterations: 1, actualSizeMBPerIteration: 100 };
  if (selectedSizeMB <= 500) return { url: `${DOWNLOAD_BASE_URL}100MB.bin`, iterations: 5, actualSizeMBPerIteration: 100 }; // 5x100MB
  return { url: `${DOWNLOAD_BASE_URL}100MB.bin`, iterations: 10, actualSizeMBPerIteration: 100 }; // 10x100MB for 1000MB
};

export default function SpeedTestUI() {
  const { t } = useLanguage();
  const { toast: showToast } = useToast();
  const [status, setStatus] = useState<TestStatus>('idle');
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [ping, setPing] = useState(0);
  const [selectedFileSize, setSelectedFileSize] = useState<number>(50); // Default 50MB
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Abort controller for fetch requests
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const resetSpeeds = () => {
    setDownloadSpeed(0);
    setUploadSpeed(0);
    setPing(0);
    setErrorMessage(null);
  };

  const measureDownloadSpeed = async (fileSizeMB: number, controller: AbortController) => {
    const { url: baseUrl, iterations, actualSizeMBPerIteration } = getDownloadFileConfig(fileSizeMB);
    let totalBytesDownloaded = 0;
    let totalTimeSeconds = 0;

    for (let i = 0; i < iterations; i++) {
      if (controller.signal.aborted) throw new Error("Download aborted by user");
      
      const cacheBuster = `?r=${Math.random()}`;
      const currentUrl = baseUrl + cacheBuster;
      const startTime = performance.now();
      let receivedLength = 0;

      try {
        const response = await fetch(currentUrl, { signal: controller.signal, mode: 'cors' });
        if (!response.ok) throw new Error(`Download failed: ${response.statusText} for ${currentUrl}`);
        if (!response.body) throw new Error("ReadableStream not available for download.");

        const reader = response.body.getReader();
        // eslint-disable-next-line no-constant-condition
        while (true) {
          if (controller.signal.aborted) {
            reader.cancel("Download aborted by user");
            throw new Error("Download aborted by user");
          }
          const { done, value } = await reader.read();
          if (done) break;
          
          receivedLength += value.length;
          totalBytesDownloaded += value.length;
          const elapsedTimeIteration = (performance.now() - startTime) / 1000;
          const currentTotalElapsedTime = totalTimeSeconds + elapsedTimeIteration;

          if (currentTotalElapsedTime > 0) {
            const speedMbps = (totalBytesDownloaded * 8) / currentTotalElapsedTime / 1000000;
            setDownloadSpeed(speedMbps);
          }
        }
        const iterationTimeSeconds = (performance.now() - startTime) / 1000;
        totalTimeSeconds += iterationTimeSeconds;

      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log("Download fetch aborted.");
          throw error;
        }
        console.error("Download error in iteration:", error);
        setErrorMessage(t('download') + ' ' + t('testing') + ' Error: ' + error.message);
        throw error; // Propagate error to stop test
      }
    }
    
    if (totalTimeSeconds > 0) {
      const finalSpeedMbps = (totalBytesDownloaded * 8) / totalTimeSeconds / 1000000;
      setDownloadSpeed(finalSpeedMbps);
      return finalSpeedMbps;
    }
    return 0;
  };

  const measureUploadSpeed = async (controller: AbortController) => {
    // Simulate by POSTing a smaller, fixed amount of data, e.g., 5MB
    const uploadDataSizeMB = Math.min(selectedFileSize, 5); // Cap actual upload data size for quick test
    const dataSizeInBytes = uploadDataSizeMB * 1024 * 1024;
    const randomData = new Uint8Array(dataSizeInBytes);
    crypto.getRandomValues(randomData); // Fill with random data
    const blob = new Blob([randomData]);

    const startTime = performance.now();
    try {
      // Simulate progress visually
      for (let p = 0; p <= 100; p += 10) {
        if (controller.signal.aborted) throw new Error("Upload aborted by user");
        setUploadSpeed(p * (Math.random()*0.5 + 0.5) * (uploadDataSizeMB / 2) ); // Rough visual simulation
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      await fetch(UPLOAD_URL, { method: 'POST', body: blob, signal: controller.signal, mode: 'cors' });
      const elapsedTimeSeconds = (performance.now() - startTime) / 1000;
      if (elapsedTimeSeconds > 0) {
        const speedMbps = (dataSizeInBytes * 8) / elapsedTimeSeconds / 1000000;
        setUploadSpeed(speedMbps);
        return speedMbps;
      }
    } catch (error: any) {
       if (error.name === 'AbortError') {
          console.log("Upload fetch aborted.");
          throw error;
        }
      console.error("Upload error:", error);
      setErrorMessage(t('upload') + ' ' + t('testing') + ' Error: ' + error.message);
      throw error;
    }
    return 0;
  };

  const measurePing = async (controller: AbortController) => {
    const numPings = 5;
    let totalPingTime = 0;
    let successfulPings = 0;

    for (let i = 0; i < numPings; i++) {
      if (controller.signal.aborted) throw new Error("Ping aborted by user");
      const startTime = performance.now();
      try {
        await fetch(`${PING_URL_BASE}?r=${Math.random()}&i=${i}`, { method: 'HEAD', signal: controller.signal, mode: 'cors' });
        const endTime = performance.now();
        const currentPing = endTime - startTime;
        totalPingTime += currentPing;
        successfulPings++;
        setPing(totalPingTime / successfulPings); // Update with average so far
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between pings
      } catch (error: any) {
         if (error.name === 'AbortError') {
            console.log("Ping fetch aborted.");
            throw error;
          }
        console.error("Ping error:", error);
        // Don't stop the whole test for a single ping error, but log it
        // If all pings fail, the ping will remain 0 or the last successful average.
      }
    }

    if (successfulPings > 0) {
      const avgPing = totalPingTime / successfulPings;
      setPing(avgPing);
      return avgPing;
    }
    setErrorMessage(t('ping') + ' ' + t('testing') + ' Error: Could not measure ping.');
    return 0;
  };


  const runTest = useCallback(async (currentFileSize: number) => {
    const newAbortController = new AbortController();
    setAbortController(newAbortController);
    resetSpeeds();
    setStatus('testing-download');

    try {
      await measureDownloadSpeed(currentFileSize, newAbortController);
      if (newAbortController.signal.aborted) { setStatus('idle'); return; }

      setStatus('testing-upload');
      await measureUploadSpeed(newAbortController);
      if (newAbortController.signal.aborted) { setStatus('idle'); return; }
      
      setStatus('testing-ping');
      await measurePing(newAbortController);
      if (newAbortController.signal.aborted) { setStatus('idle'); return; }

      setStatus('finished');
    } catch (error: any) {
      console.error("Test run failed:", error);
      if (error.name !== 'AbortError') {
        showToast({
          variant: "destructive",
          title: t('testing') + " Error",
          description: error.message || "An unknown error occurred during the test.",
        });
        setStatus('error');
        setErrorMessage(error.message || "An unknown error occurred.");
      } else {
        showToast({
          title: "Test Aborted",
          description: "The speed test was cancelled.",
        });
        setStatus('idle');
      }
    } finally {
      setAbortController(null); // Clear abort controller
    }
  }, [t, showToast, selectedFileSize]); // Added selectedFileSize to dependencies

  const handleStartOrCancelTest = () => {
    if (status === 'idle' || status === 'finished' || status === 'error') {
      runTest(selectedFileSize);
    } else if (status.startsWith('testing')) {
      if (abortController) {
        abortController.abort();
      }
      resetSpeeds();
      setStatus('idle');
    }
  };

  const getButtonText = () => {
    if (status === 'idle' || status === 'error') return t('startTest');
    if (status.startsWith('testing')) return t('testing') + "... (" + t('cancel') + ")"; // Added cancel
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
      case 'error':
        return t('testFailed');
      default:
        return t('tagline');
    }
  }

  return (
    <div className="flex flex-col items-center space-y-6 py-8">
      <h1 className="text-3xl md:text-4xl font-bold text-center">
        <span className="text-primary">KSA</span><span className="text-accent">test</span>
      </h1>
      <p className="text-lg text-muted-foreground text-center h-6">{getStatusText()}</p>
      
      {status === 'error' && errorMessage && (
        <Alert variant="destructive" className="w-full max-w-md">
          <Terminal className="h-4 w-4" />
          <AlertTitle>{t('errorOccurred')}</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <Gauge value={downloadSpeed} maxValue={selectedFileSize > 200 ? 1000 : (selectedFileSize > 50 ? 500 : 200)} label={t('download')} unit={t('mbps')} />
        <Gauge value={uploadSpeed} maxValue={selectedFileSize > 50 ? 100: 50} label={t('upload')} unit={t('mbps')} />
        <Gauge value={ping} maxValue={200} label={t('ping')} unit={t('ms')} />
      </div>
      
      <div className="w-full max-w-xs space-y-2 mt-4">
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
        onClick={handleStartOrCancelTest}
        className="min-w-[240px] text-lg py-6 px-8 rounded-full shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl transform hover:scale-105 mt-4"
      >
        {status.startsWith('testing') ? (
          <RotateCcw className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <Play className="mr-2 h-5 w-5" />
        )}
        {getButtonText()}
      </Button>

       <Alert className="w-full max-w-2xl mt-6">
        <Terminal className="h-4 w-4" />
        <AlertTitle>{t('disclaimerTitle')}</AlertTitle>
        <AlertDescription>
          {t('disclaimerText')}
        </AlertDescription>
      </Alert>
    </div>
  );
}

