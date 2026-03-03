import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/auth/signup - Inscription + Magic Link
 * Body: { email: string, business_name: string }
 * Crée un account sans user_id (lié au premier login via callback)
 */
export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: "Auth non configuré" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as { email?: string; business_name?: string };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : null;
    const businessName = typeof body.business_name === "string" ? body.business_name.trim() : null;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email requis" },
        { status: 400 }
      );
    }

    if (!businessName) {
      return NextResponse.json(
        { success: false, error: "business_name requis" },
        { status: 400 }
      );
    }

    // Créer l'account (sans user_id, sera lié au callback)
    const { data: account, error: accountError } = await supabaseAdmin
      .from("accounts")
      .insert({
        name: businessName,
        email,
      })
      .select("id")
      .single();

    if (accountError) {
      console.error("Erreur création account:", accountError);
      return NextResponse.json(
        { success: false, error: accountError.message },
        { status: 400 }
      );
    }

    // Envoyer le magic link
    const { error: otpError } = await supabaseAdmin.auth.signInWithOtp({ email });

    if (otpError) {
      console.error("Erreur signInWithOtp:", otpError);
      return NextResponse.json(
        { success: false, error: otpError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Inscription réussie. Consultez votre email pour le lien de connexion.",
      account_id: account.id,
    });
  } catch (err) {
    console.error("Erreur POST /auth/signup:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
