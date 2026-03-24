import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendPushNotification, parseCallbackDelay } from "@/modules/notifications/notifications.service";

/**
 * GET /api/cron/reminder — Rappels leads a_traiter depuis trop longtemps
 * Déclenché toutes les heures par Vercel Cron (vercel.json).
 * Protégé par Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("Authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { success: false, error: "supabaseAdmin non configuré" },
      { status: 500 }
    );
  }

  try {
    // 1. Récupérer tous les comptes avec au moins une subscription active
    const { data: subs } = await supabaseAdmin
      .from("push_subscriptions")
      .select("account_id")
      .eq("platform", "web");

    if (!subs || subs.length === 0) {
      return NextResponse.json({ success: true, notified: 0 });
    }

    // Dédupliquer les account_ids
    const accountIds = [...new Set(subs.map((s) => s.account_id as string))];

    // 2. Récupérer callback_delay pour chaque compte
    const { data: accounts } = await supabaseAdmin
      .from("accounts")
      .select("id, callback_delay")
      .in("id", accountIds);

    let totalNotified = 0;

    for (const account of accounts ?? []) {
      const delayHours = parseCallbackDelay(account.callback_delay as string | null);
      const cutoff = new Date(Date.now() - delayHours * 60 * 60 * 1000).toISOString();

      // Leads a_traiter dont last_inbound_sms_at <= cutoff et reminder_sent_at IS NULL
      const { data: leads } = await supabaseAdmin
        .from("leads")
        .select("id, full_name, priority_score")
        .eq("account_id", account.id as string)
        .eq("status", "a_traiter")
        .lte("last_inbound_sms_at", cutoff)
        .is("reminder_sent_at", null);

      if (!leads || leads.length === 0) continue;

      const count = leads.length;
      const names = leads
        .slice(0, 2)
        .map((l) => (l.full_name as string | null) || "Inconnu")
        .join(", ");
      const body = count === 1
        ? `${names} attend un rappel`
        : `${names}… (${count} demandes)`;

      await sendPushNotification(account.id as string, {
        title: `${count} demande${count > 1 ? "s" : ""} à rappeler`,
        body,
        url: "/dashboard",
      });

      // Marquer reminder_sent_at pour éviter les doublons
      const leadIds = leads.map((l) => l.id as string);
      await supabaseAdmin
        .from("leads")
        .update({ reminder_sent_at: new Date().toISOString() })
        .in("id", leadIds);

      totalNotified += count;
    }

    console.log("[Cron reminder] %d lead(s) rappelé(s)", totalNotified);
    return NextResponse.json({ success: true, notified: totalNotified });
  } catch (err) {
    console.error("[Cron reminder] Erreur:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
