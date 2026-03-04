import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { ApiError } from "@/lib/utils";

interface OnboardingBody {
  owner_phone?: string;
  city?: string;
  specialty?: string;
}

// Valide un numéro de mobile français (06, 07, +336, +337) après normalisation
function isValidFrenchMobile(raw: string): boolean {
  const trimmed = raw.trim();
  // On retire les espaces pour la validation
  const normalized = trimmed.replace(/\s+/g, "");
  const regex = /^(0[67]|\+33[67])\d{8}$/;
  return regex.test(normalized);
}

export async function PATCH(req: NextRequest) {
  try {
    const { account_id } = await requireAuth(req);

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: "Auth non configuré" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as OnboardingBody;

    const ownerPhone =
      typeof body.owner_phone === "string" ? body.owner_phone.trim() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const specialtyRaw =
      typeof body.specialty === "string" ? body.specialty.trim() : "";

    if (!ownerPhone) {
      return NextResponse.json(
        { success: false, error: "Numéro de mobile requis" },
        { status: 400 }
      );
    }

    if (!isValidFrenchMobile(ownerPhone)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Merci d’indiquer un numéro de mobile français valide (06, 07, +336 ou +337).",
        },
        { status: 400 }
      );
    }

    if (!city) {
      return NextResponse.json(
        { success: false, error: "Ville requise" },
        { status: 400 }
      );
    }

    const specialty =
      specialtyRaw.length > 0 ? specialtyRaw.toLowerCase() : "electricien";

    const { error } = await supabaseAdmin
      .from("accounts")
      .update({
        owner_phone: ownerPhone,
        city,
        specialty,
        onboarding_completed: true,
      })
      .eq("id", account_id);

    if (error) {
      console.error("Erreur update onboarding account:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Impossible de terminer l’onboarding. Veuillez réessayer.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Onboarding terminé",
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    console.error("Erreur PATCH /auth/onboarding:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

