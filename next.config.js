/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config) => {
    // Direct alias for the local starknet fork (bypasses yarn link double-symlink resolution issues)
    // Point directly to the ESM build to avoid webpack picking up the `browser` field
    // which resolves to the IIFE global bundle (dist/index.global.js) — not usable as a module.
    config.resolve.alias['starknet'] = '/D/starknetFork/starknet.js/dist/index.mjs';
    return config;
  },
}

module.exports = nextConfig
