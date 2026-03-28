import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

export function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname === '/api/analyze' &&
    request.method === 'POST'
  ) {
    const ip = getClientIp(request);
    const now = Date.now();
    const entry = rateLimitStore.get(ip);

    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    } else if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a minute before trying again.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
            'X-RateLimit-Limit': String(MAX_REQUESTS_PER_WINDOW),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    } else {
      entry.count++;
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS_PER_WINDOW));
    response.headers.set(
      'X-RateLimit-Remaining',
      String(MAX_REQUESTS_PER_WINDOW - (rateLimitStore.get(ip)?.count ?? 1))
    );
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
