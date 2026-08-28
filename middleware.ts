import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Web-standard cryptographically random base64 nonce
  const nonce = btoa(crypto.randomUUID());

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com data:;
    img-src 'self' data: blob:;
    connect-src 'self' https://storgekrd-amdakalar.aws-ap-northeast-1.turso.io wss://storgekrd-amdakalar.aws-ap-northeast-1.turso.io https://fonts.googleapis.com https://fonts.gstatic.com data: blob:;
    manifest-src 'self' https://vercel.com;
    frame-ancestors 'none';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
    report-uri /api/csp-report;
  `.replace(/\s{2,}/g, ' ').trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('x-nonce', nonce);
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.set('Server', 'storagekrd');

  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|drone_battery_app_icon.png|favicon.svg).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
