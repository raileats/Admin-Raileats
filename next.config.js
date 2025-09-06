/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optional: rewrite so admin.raileats.in/ -> /admin
  // Uncomment and adjust hostname if you use a separate admin domain
  /*
  async rewrites() {
    return [
      {
        source: '/',
        has: [{ type: 'host', value: 'admin.raileats.in' }],
        destination: '/admin'
      }
    ]
  }
  */
};

module.exports = nextConfig;
