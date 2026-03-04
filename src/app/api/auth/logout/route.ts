import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout - Supprime le cookie de session
 */
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("sb-access-token", "", {
    path: "/",
    maxAge: 0,
  });
  return response;
}
