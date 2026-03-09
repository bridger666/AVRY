/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // canvas is not available in the browser — alias to false to prevent build errors
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      }
    }
    return config
  },

  // Prevent browsers from caching HTML pages so they always fetch fresh
  // chunk references after a rebuild.
  // Next.js already sets immutable cache headers on /_next/static/ internally.
  // We only need to override the HTML page cache (Next sets s-maxage=31536000
  // on statically prerendered pages by default, which causes browsers to serve
  // stale HTML with old chunk hashes after a rebuild).
  async headers() {
    return [
      {
        // No-cache for page HTML only. Must NOT match /_next/static or /_next/image
        // — Next.js serves those with immutable headers internally and overriding
        // them causes 400s on static chunk requests.
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
      {
        // App pages (not _next assets, not api routes, not public files)
        source: '/((?!_next/|api/|favicon|.*\\.).*)',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
    ]
  },
}

module.exports = nextConfig
