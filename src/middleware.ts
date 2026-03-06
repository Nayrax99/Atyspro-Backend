/**
 * Middleware CORS - autorise les origines connues sur /api/*
 * Gère les preflight OPTIONS et injecte les headers sur toutes les réponses API.
 */
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://atyspro-mobile.vercel.app',
  // dev local Expo web
  'http://localhost:8081',
  'http://localhost:19006',
  'http://localhost:3000',
];

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin') ?? '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin);

  // Preflight OPTIONS
  if (req.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 204 });
    if (isAllowed) {
      res.headers.set('Access-Control-Allow-Origin', origin);
      for (const [k, v] of Object.entries(CORS_HEADERS)) {
        res.headers.set(k, v);
      }
    }
    return res;
  }

  const res = NextResponse.next();
  if (isAllowed) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
      res.headers.set(k, v);
    }
  }
  return res;
}

export const config = {
  matcher: '/api/:path*',
};
