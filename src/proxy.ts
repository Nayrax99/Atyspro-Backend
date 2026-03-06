/**
 * Proxy CORS pour /api/* — Next.js 16 (remplace middleware.ts).
 * Répond à OPTIONS (preflight) et ajoute les en-têtes CORS sur les réponses.
 */
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "https://atyspro-mobile.vercel.app",
  "http://localhost:8081",
  "http://localhost:19006",
  "http://localhost:3000",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:19006",
];

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:"))
    return true;
  return false;
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";

  if (request.method === "OPTIONS") {
    const headers: Record<string, string> = {
      ...CORS_HEADERS,
      ...(isAllowedOrigin(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    };
    return new NextResponse(null, { status: 204, headers });
  }

  const response = NextResponse.next();
  if (isAllowedOrigin(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    Object.entries(CORS_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
  }
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
