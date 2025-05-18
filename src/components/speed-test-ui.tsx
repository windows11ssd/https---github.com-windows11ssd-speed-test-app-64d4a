
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

const CACHEFLY_BASE_URL = "https://cachefly.cachefly.net/api/test.php"; // Using an API endpoint for dynamic file sizes might be more robust if available, or stick to named files.
// Sticking to named files for simplicity as per previous implementation.
const CACHEFLY_FILE_URL_BASE = "https://cachefly.cachefly.net/";
const UPLOAD_URL = "https://httpbin.org/post"; 
const PING_URL_BASE = "https://cachefly.cachefly.net/";


const getDownloadFileConfig = (selectedSizeMB: number): { url: string, actualSizeMB: number } => {
  // Cachefly provides specific file sizes like 1mb.test, 10mb.test, 100mb.test etc.
  // For 500MB and 1000MB, we'd typically fetch the largest available (e.g. 100MB) multiple times,
  // but the previous implementation correctly switched to single, appropriately named files.
  const fileName = `${selectedSizeMB}mb.test`;
  return { url: `${CACHEFLY_FILE_URL_BASE}${fileName}`, actualSizeMB: selectedSizeMB };
};


export default function SpeedTestUI() {
  const { t } = useLanguage();
  const { toast: showToast } = useToast();
  const [status, setStatus] = useState<TestStatus>('idle');
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [ping, setPing] = useState(0);
  const [selectedFileSize, setSelectedFileSize] = useState<number>(50); 
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const resetSpeeds = () => {
    setDownloadSpeed(0);
    setUploadSpeed(0);
    setPing(0);
    setErrorMessage(null);
  };

  const measureDownloadSpeed = async (fileSizeMB: number, controller: AbortController) => {
    const { url } = getDownloadFileConfig(fileSizeMB);
    
    const cacheBuster = `?r=${Math.random()}`; // Cache buster
    const currentUrl = url + cacheBuster;
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
          reader.cancel("Download aborted by user").catch(() => {}); // Catch potential error on cancel
          throw new Error("Download aborted by user");
        }
        const { done, value } = await reader.read();
        if (done) break;
        
        receivedLength += value.length;
        const elapsedTime = (performance.now() - startTime) / 1000;

        if (elapsedTime > 0) {
          const speedMbps = (receivedLength * 8) / elapsedTime / 1000000;
          setDownloadSpeed(speedMbps); 
        }
      }
      const totalTimeSeconds = (performance.now() - startTime) / 1000;

      if (totalTimeSeconds > 0) {
        const finalSpeedMbps = (receivedLength * 8) / totalTimeSeconds / 1000000;
        setDownloadSpeed(finalSpeedMbps); 
        return finalSpeedMbps;
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("Download fetch aborted.");
        // No need to set error message here as runTest will handle it.
        throw error;
      }
      console.error("Download error:", error);
      setErrorMessage(t('download') + ' ' + t('testing') + ' Error: ' + error.message);
      throw error; 
    }
    return 0;
  };

  const measureUploadSpeed = async (controller: AbortController) => {
    const uploadDataSizeMB = Math.min(selectedFileSize, 5); // Keep upload size manageable
    const dataSizeInBytes = uploadDataSizeMB * 1024 * 1024;
    const randomData = new Uint8Array(dataSizeInBytes);

    const MAX_ENTROPY_CHUNK_SIZE = 65536; // 64KB
    if (dataSizeInBytes > 0) {
      for (let offset = 0; offset < dataSizeInBytes; offset += MAX_ENTROPY_CHUNK_SIZE) {
        if (controller.signal.aborted) throw new Error("Upload data generation aborted by user");
        const chunkLength = Math.min(MAX_ENTROPY_CHUNK_SIZE, dataSizeInBytes - offset);
        // Create a view into the main buffer for the current chunk
        const chunk = new Uint8Array(randomData.buffer, offset, chunkLength);
        crypto.getRandomValues(chunk);
      }
    }
    
    const blob = new Blob([randomData]);
    const startTime = performance.now();
    let progressInterval: NodeJS.Timeout | null = null;

    try {
      // Simulate visual progress on the gauge while fetch is in progress
      let simulatedProgress = 0;
      const estimatedMaxSimSpeed = Math.min(uploadSpeed > 0 ? uploadSpeed * 1.2 : 20, 100); // Simulate up to 100Mbps or 1.2x current

      progressInterval = setInterval(() => {
        if (controller.signal.aborted) {
          if(progressInterval) clearInterval(progressInterval);
          return;
        }
        simulatedProgress += 5; // Increment simulated progress
        if (simulatedProgress <= 100) {
          const currentSimSpeed = (simulatedProgress / 100) * estimatedMaxSimSpeed;
          setUploadSpeed(currentSimSpeed);
        } else {
          if(progressInterval) clearInterval(progressInterval); 
        }
      }, 80); // Update every 80ms for smoother visual

      await fetch(UPLOAD_URL, { method: 'POST', body: blob, signal: controller.signal, mode: 'cors' });
      if(progressInterval) clearInterval(progressInterval);
      
      const elapsedTimeSeconds = (performance.now() - startTime) / 1000;
      if (elapsedTimeSeconds > 0) {
        const speedMbps = (dataSizeInBytes * 8) / elapsedTimeSeconds / 1000000;
        setUploadSpeed(speedMbps); // Set final actual speed
        return speedMbps;
      }
    } catch (error: any) {
      if(progressInterval) clearInterval(progressInterval);
      if (error.name === 'AbortError') {
        console.log("Upload fetch aborted.");
        throw error;
      }
      console.error("Upload error:", error);
      // Check if error.message already contains a translated part, avoid double translation.
      const baseErrorMessage = t('upload') + ' ' + t('testing') + ' Error: ';
      setErrorMessage(error.message?.startsWith(baseErrorMessage) ? error.message : baseErrorMessage + error.message);
      throw error;
    }
    return 0;
  };

  const measurePing = async (controller: AbortController) => {
    const numPings = 5;
    let totalPingTime = 0;
    let successfulPings = 0;
    // Use a small, uniquely named file for ping to avoid caching issues and ensure HEAD is efficient.
    const pingTestFile = `${PING_URL_BASE}1kb.test`; 

    for (let i = 0; i < numPings; i++) {
      if (controller.signal.aborted) throw new Error("Ping aborted by user");
      const startTime = performance.now();
      try {
        // Add unique query param for each ping attempt
        await fetch(`${pingTestFile}?r=${Math.random()}&i=${i}`, { method: 'HEAD', signal: controller.signal, mode: 'cors', cache: 'no-store' });
        const endTime = performance.now();
        const currentPing = endTime - startTime;
        totalPingTime += currentPing;
        successfulPings++;
        setPing(totalPingTime / successfulPings); 
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between pings
      } catch (error: any) {
         if (error.name === 'AbortError') {
            console.log("Ping fetch aborted.");
            throw error;
          }
        console.error("Ping error on attempt " + (i+1) + ":", error);
        // Optionally, don't throw immediately, let it try other pings
      }
    }

    if (successfulPings > 0) {
      const avgPing = totalPingTime / successfulPings;
      setPing(avgPing);
      return avgPing;
    }
    const pingErrorMessage = t('ping') + ' ' + t('testing') + ' Error: Could not measure ping.';
    setErrorMessage(pingErrorMessage);
    // Don't throw here, just report error. Test can continue if other phases succeeded.
    // Or, if ping is critical, throw new Error(pingErrorMessage);
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
      await measureUploadSpeed(newAbortController); // Pass selectedFileSize for context if needed, though it caps at 5MB
      if (newAbortController.signal.aborted) { setStatus('idle'); return; }
      
      setStatus('testing-ping');
      await measurePing(newAbortController);
      if (newAbortController.signal.aborted) { setStatus('idle'); return; }

      setStatus('finished');
    } catch (error: any) {
      console.error("Test run failed:", error);
      if (error.name !== 'AbortError') {
        // errorMessage is already set by individual measure functions if they fail
        const finalErrorMessage = errorMessage || error.message || "An unknown error occurred during the test.";
        showToast({
          variant: "destructive",
          title: t('testing') + " " + t('errorOccurred'),
          description: finalErrorMessage,
        });
        setStatus('error');
        // Ensure errorMessage state reflects the caught error if not already set.
        if (!errorMessage) setErrorMessage(finalErrorMessage);
      } else {
        showToast({
          title: "Test Aborted",
          description: "The speed test was cancelled.",
        });
        setStatus('idle');
      }
    } finally {
      setAbortController(null); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, showToast, selectedFileSize, errorMessage]); // Added errorMessage to dep array for toast consistency

  const handleStartOrCancelTest = () => {
    if (status === 'idle' || status === 'finished' || status === 'error') {
      runTest(selectedFileSize);
    } else if (status.startsWith('testing')) {
      if (abortController) {
        abortController.abort();
        // State updates (resetSpeeds, setStatus) will be handled by the runTest catch/finally block
      }
    }
  };

  const getButtonText = () => {
    if (status === 'idle' || status === 'error') return t('startTest');
    if (status.startsWith('testing')) return `${t('testing')}... (${t('cancel')})`;
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl px-2">
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

    