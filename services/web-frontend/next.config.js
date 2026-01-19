/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // API rewrites to backend services via Kong
  async rewrites() {
    const apiUrl = process.env.API_URL || 'http://localhost:8000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
