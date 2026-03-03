import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/auth/callback - Liage user ↔ account après clic magic link
 * Query: token (ou access_token)
 * À configurer comme URL de redirection Supabase.
 */
export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.redirect(
        new URL("/auth/error?message=Auth+non+configuré", getAppUrl())
      );
    }

    const token =
      req.nextUrl.searchParams.get("token") ??
      req.nextUrl.searchParams.get("access_token") ??
      "";

    if (!token) {
      return NextResponse.redirect(
        new URL("/auth/error?message=Token+manquant", getAppUrl())
      );
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user?.email) {
      console.error("Erreur validation token:", error);
      return NextResponse.redirect(
        new URL("/auth/error?message=Token+invalide", getAppUrl())
      );
    }

    // Chercher un account sans user_id avec le même email
    const { data: account } = await supabaseAdmin
      .from("accounts")
      .select("id")
      .eq("email", user.email)
      .is("user_id", null)
      .limit(1)
      .maybeSingle();

    if (account) {
      await supabaseAdmin
        .from("accounts")
        .update({ user_id: user.id })
        .eq("id", account.id);
    }

    return NextResponse.redirect(getAppUrl());
  } catch (err) {
    console.error("Erreur GET /auth/callback:", err);
    return NextResponse.redirect(
      new URL("/auth/error?message=Erreur+serveur", getAppUrl())
    );
  }
}

function getAppUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return base.replace(/\/$/, "");
}
