/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export — all data is client-side RPC, so the site is pure static
  // assets and can be served from Walrus Sites (the dApp itself on Walrus).
  output: 'export',
  trailingSlash: true,
};

export default nextConfig;
