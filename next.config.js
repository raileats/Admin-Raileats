/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/',
        has: [{ type: 'host', value: 'admin.raileats.in' }],
        destination: '/admin'
      }
    ];
  }
};

module.exports = nextConfig;
