/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

/**
 * Baseline document headers. The CSP is report-only so it cannot break the
 * Monaco editor, Firebase popups or the sandboxed preview iframe while the
 * policy is validated in the field.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://*.firebaseapp.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://identitytoolkit.googleapis.com${isDev ? ' http://localhost:5000 ws://localhost:3000' : ''}`,
  "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
  { key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicy },
];

if (!isDev) {
  securityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  });
}

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Long-lived caching for immutable static assets keeps repeat navigations
  // fast; the background artwork is the single largest first-screen asset.
  async headers() {
    const cache = [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }];
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/_next/static/:path*', headers: cache },
      { source: '/backgrounds/:path*', headers: cache },
    ];
  },
};

export default nextConfig;
