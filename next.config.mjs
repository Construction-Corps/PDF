/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    images: {
      unoptimized: true,
    },
    distDir: 'out',
    reactStrictMode: false,
  }
  
  export default nextConfig;