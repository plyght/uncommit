/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development';
const basePath = isDev ? '' : '/uncommit';

const nextConfig = {
  reactStrictMode: true,
  ...(basePath && { basePath, assetPrefix: basePath }),
}

module.exports = nextConfig
