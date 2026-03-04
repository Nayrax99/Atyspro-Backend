import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/auth/signup - Inscription email + mot de passe
 * Body: { email: string, password: string, business_name: string }
 */
export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: "Auth non configuré" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as {
      email?: string;
      password?: string;
      business_name?: string;
    };

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : null;
    const password =
      typeof body.password === "string" ? body.password.trim() : null;
    const businessName =
      typeof body.business_name === "string" ? body.business_name.trim() : null;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email requis" },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Mot de passe requis" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "Le mot de passe doit contenir au moins 6 caractères.",
        },
        { status: 400 }
      );
    }

    if (!businessName) {
      return NextResponse.json(
        { success: false, error: "Nom d’entreprise requis" },
        { status: 400 }
      );
    }

    // Création de l'utilisateur Supabase avec email + mot de passe
    const {
      data: { user },
      error: createError,
    } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError || !user) {
      console.error("Erreur création utilisateur:", createError);
      return NextResponse.json(
        {
          success: false,
          error: "Impossible de créer le compte. Veuillez réessayer.",
        },
        { status: 400 }
      );
    }

    const { error: accountError } = await supabaseAdmin.from("accounts").insert({
      name: businessName,
      email,
      user_id: user.id,
    });

    if (accountError) {
      console.error("Erreur création account:", accountError);
      return NextResponse.json(
        {
          success: false,
          error: "Une erreur est survenue lors de la création du compte.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Compte créé avec succès",
    });
  } catch (err) {
    console.error("Erreur POST /auth/signup:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Une erreur est survenue. Veuillez réessayer.",
      },
      { status: 500 }
    );
  }
}
