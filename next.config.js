/** @type {import('next').NextConfig} */
const nextConfig = {
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
  env: {
    NEXT_PUBLIC_STRIPE_GROWTH_PLAN_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_GROWTH_PLAN_PRICE_ID,
    NEXT_PUBLIC_STRIPE_PERFORMANCE_PLAN_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PERFORMANCE_PLAN_PRICE_ID,
  },
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP'],
  }
};

module.exports = nextConfig;
