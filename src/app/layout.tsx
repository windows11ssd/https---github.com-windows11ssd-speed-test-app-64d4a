
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/contexts/language-context';
import { Toaster } from "@/components/ui/toaster";
import AppHeader from '@/components/layout/header';
import PWAInstallPrompt from '@/components/pwa-install-prompt';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'KSA Test',
  description: 'Test your internet speed with KSA Test.',
  manifest: '/manifest.json',
  icons: [
    { rel: 'apple-touch-icon', url: '/icons/icon-192x192.png' },
  ],
};

export const viewport: Viewport = {
  themeColor: '#A265F5', // Vibrant Purple
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // `LanguageProvider` no longer uses a function child.
  // The `<html>` tag attributes are set here directly for SSR with a default.
  // `LanguageProvider`'s `useEffect` will update them on the client based on stored preferences.
  return (
    // Default to 'ar' for SSR lang/dir, as LanguageProvider state initializes to 'ar'.
    // Client-side useEffect in LanguageProvider will update this based on localStorage after hydration.
    <html lang="ar" dir="rtl">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <LanguageProvider> {/* LanguageProvider now wraps the content inside <body> */}
          <div className="flex flex-col min-h-screen">
            <AppHeader />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <PWAInstallPrompt />
            <Toaster />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
