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

  transpilePackages: [
    '@wilms/shared-contracts',
    '@wilms/shared-rbac',
    '@wilms/shared-types',
    '@wilms/shared-validation',
    '@wilms/shared-utils',
  ],

  experimental: {

    optimizePackageImports: ['lucide-react'],

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



    return config;

  },

};



export default nextConfig;


