
require('dotenv-expand').expand(require('dotenv').config());

/** @type {import('next').NextConfig} */
const nextConfig = {
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
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      }
    ],
  },
  // Redirecionamentos para SEO
  redirects: async () => {
    return [
      {
        source: '/:path*/', // Captura qualquer rota com uma barra no final
        destination: '/:path*', // Redireciona para a mesma rota sem a barra
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'usb=()',
              'serial=()',
              'hid=()',
              'autoplay=(self)',
              'cross-origin-isolated=()'
            ].join(', ')
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.stripe.com https://apis.google.com https://www.gstatic.com https://*.firebaseapp.com https://*.googletagmanager.com https://*.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' https: data:; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' * wss:; frame-src 'self' https://*.firebaseapp.com https://*.stripe.com;"
          }
        ],
      },
    ];
  },
  // Force dynamic rendering to prevent stale data from being served from cache.
  // This ensures all pages fetch the latest data on every request.
  output: 'standalone',
  
};

module.exports = nextConfig;
