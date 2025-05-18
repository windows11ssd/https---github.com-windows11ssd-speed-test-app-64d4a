
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
  themeColor: '#A265F5', // Vibrant Purple (Used for light mode, dark mode might override this if specified differently)
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
  return (
    // Default to 'ar' for SSR lang/dir. Add 'dark' class for default dark theme.
    // Client-side useEffect in LanguageProvider will update lang/dir based on localStorage after hydration.
    <html lang="ar" dir="rtl" className="dark">
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
