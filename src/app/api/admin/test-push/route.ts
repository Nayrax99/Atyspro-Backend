import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { sendPushNotification } from "@/modules/notifications/notifications.service";
import { ApiError } from "@/lib/utils";

/**
 * POST /api/admin/test-push — Envoie une notification push de test à l'account connecté (admin)
 */
export async function POST(req: NextRequest) {
  try {
    const { account_id } = await requireAuth(req);

    const { data: adminAccount } = await supabaseAdmin!
      .from("accounts")
      .select("is_admin")
      .eq("id", account_id)
      .maybeSingle();

    if (!adminAccount?.is_admin) {
      return NextResponse.json(
        { success: false, error: "Accès refusé : droits administrateur requis" },
        { status: 403 }
      );
    }

    await sendPushNotification(account_id, {
      title: "Test AtysPro 🔔",
      body: "Vos notifications push fonctionnent correctement.",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
