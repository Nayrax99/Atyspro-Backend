import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/auth/forgot-password - Envoi d'un email de réinitialisation
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
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : null;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email requis" },
        { status: 400 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      "http://localhost:3000";

    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/reset-password`,
    });

    if (error) {
      console.error("Erreur resetPasswordForEmail:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Impossible d'envoyer l'email de réinitialisation.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email de réinitialisation envoyé",
    });
  } catch (err) {
    console.error("Erreur POST /auth/forgot-password:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Une erreur est survenue. Veuillez réessayer.",
      },
      { status: 500 }
    );
  }
}

