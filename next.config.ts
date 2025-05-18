import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Basic PWA setup can be done with manifest.json and service workers.
  // For more advanced PWA features with Next.js, a package like `next-pwa` might be used.
  // However, for this scope, we'll rely on the manifest and a simple service worker (if added).
  // No specific Next.js config changes are strictly required for a basic PWA manifest.
};

export default nextConfig;
