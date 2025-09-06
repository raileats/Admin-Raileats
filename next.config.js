async rewrites() {
  return [
    {
      source: '/',
      has: [{ type: 'host', value: 'admin.raileats.in' }],
      destination: '/admin'
    }
  ];
}
