/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // The API streams multipart uploads separately; backend per-file limits apply.
  experimental: {serverActions: {bodySizeLimit: "85mb"}},
  async headers(){return [{source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'X-Frame-Options',value:'SAMEORIGIN'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},{key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'}]},{source:'/admin/:path*',headers:[{key:'Cache-Control',value:'private, no-store'},{key:'X-Robots-Tag',value:'noindex, nofollow'}]},{source:'/login',headers:[{key:'Cache-Control',value:'private, no-store'},{key:'X-Robots-Tag',value:'noindex, nofollow'}]}]},
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'news24x7india.com' }],
        destination: 'https://www.news24x7india.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
