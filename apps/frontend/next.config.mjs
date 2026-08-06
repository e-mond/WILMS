import path from 'node:path';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';



const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rootPackage = JSON.parse(
  readFileSync(path.join(__dirname, '../../package.json'), 'utf8'),
);



function shouldUseMockServices() {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {

    return true;

  }



  if (process.env.NEXT_PUBLIC_FORCE_DEMO_MODE === 'true') {

    return true;

  }



  if (process.env.NEXT_PUBLIC_API_DISABLED === 'true') {

    return true;

  }



  if (!process.env.NEXT_PUBLIC_API_BASE_URL?.trim()) {

    return true;

  }



  if (process.env.NEXT_PUBLIC_USE_MOCK === 'false') {

    return false;

  }



  return process.env.NODE_ENV !== 'production';

}



/** @type {import('next').NextConfig} */

const nextConfig = {

  env: {
    NEXT_PUBLIC_APP_VERSION: rootPackage.version ?? '0.0.0',
  },

  poweredByHeader: false,

  reactStrictMode: true,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(self), payment=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "style-src 'self' 'unsafe-inline'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
              "script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
              "connect-src 'self' https: wss:",
              "frame-src 'self' https://vercel.live",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  transpilePackages: [
    '@wilms/domain',
    '@wilms/shared-contracts',
    '@wilms/shared-rbac',
    '@wilms/shared-types',
    '@wilms/shared-validation',
    '@wilms/shared-utils',
  ],

  experimental: {

    optimizePackageImports: ['lucide-react'],
    serverComponentsExternalPackages: [
      '@neondatabase/serverless',
      'bcrypt',
      'bullmq',
      'ioredis',
      'ws',
      'cloudinary',
    ],
    // Ensure bcrypt native prebuilds ship with the API route handler on Vercel.
    outputFileTracingIncludes: {
      '/api/wilms/[...path]': [
        './node_modules/bcrypt/**/*',
        '../../node_modules/bcrypt/**/*',
        '../../packages/domain/package.json',
        '../../packages/domain/src/db/migrations/**/*',
        '../../data/ghana-locations/**/*',
      ],
      '/api/cron/notifications': [
        './node_modules/bcrypt/**/*',
        '../../node_modules/bcrypt/**/*',
        '../../packages/domain/package.json',
        '../../packages/domain/src/db/migrations/**/*',
        '../../data/ghana-locations/**/*',
      ],
    },

  },

  webpack: (config) => {

    const servicesEntry = shouldUseMockServices()

      ? 'index.development.ts'

      : 'index.production.ts';



    config.resolve.alias = {

      ...config.resolve.alias,

      [path.resolve(__dirname, 'src/services/index.ts')]: path.resolve(

        __dirname,

        `src/services/${servicesEntry}`,

      ),

    };

    // @wilms/domain uses ESM .js import specifiers that map to .ts sources (Node/tsx).
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };

    config.externals = config.externals || [];
    if (Array.isArray(config.externals)) {
      config.externals.push({
        'web-push': 'commonjs web-push',
        bcrypt: 'commonjs bcrypt',
        'bcryptjs': 'commonjs bcryptjs',
        ioredis: 'commonjs ioredis',
        bullmq: 'commonjs bullmq',
        ws: 'commonjs ws',
        cloudinary: 'commonjs cloudinary',
        '@neondatabase/serverless': 'commonjs @neondatabase/serverless',
      });
    }

    return config;

  },

};



export default nextConfig;


