
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
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://*.firebaseapp.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' https://placehold.co https://storage.googleapis.com https://firebasestorage.googleapis.com https://picsum.photos data:; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' * https://www.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; frame-src 'self' https://*.firebaseapp.com;"
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
