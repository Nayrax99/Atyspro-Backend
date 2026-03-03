import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/auth/login - Magic Link par email
 * Body: { email: string }
 */
export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: "Auth non configuré" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as { email?: string };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : null;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email requis" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.auth.signInWithOtp({ email });

    if (error) {
      console.error("Erreur signInWithOtp:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Magic link envoyé",
    });
  } catch (err) {
    console.error("Erreur POST /auth/login:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
