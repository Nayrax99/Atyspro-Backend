/**
 * Notifications service — envoi de push Web via VAPID
 * Compatible multi-plateforme : colonne `platform` prête pour Expo Push plus tard.
 */

import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabase";

const VAPID_PUBLIC_KEY  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT     = process.env.VAPID_SUBJECT ?? "mailto:atys@atyspro.fr";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushPayload {
  title: string;
  body:  string;
  url?:  string;
}

/**
 * Envoie une notification push à toutes les subscriptions web d'un compte.
 * Les subscriptions expirées (410/404) sont supprimées automatiquement.
 * Ne throw jamais — les erreurs sont loguées et ignorées pour ne pas bloquer les webhooks.
 */
export async function sendPushNotification(
  account_id: string,
  payload: PushPayload
): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("[Push] VAPID keys non configurées — notification ignorée");
    return;
  }

  if (!supabaseAdmin) {
    console.warn("[Push] supabaseAdmin non configuré — notification ignorée");
    return;
  }

  const { data: subs, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, subscription")
    .eq("account_id", account_id)
    .eq("platform", "web");

  if (error) {
    console.error("[Push] Erreur lecture subscriptions:", error.message);
    return;
  }

  if (!subs || subs.length === 0) return;

  const staleIds: string[] = [];

  const sendPromises = subs.map(async (row) => {
    try {
      await webpush.sendNotification(
        row.subscription as webpush.PushSubscription,
        JSON.stringify({
          title: payload.title,
          body:  payload.body,
          url:   payload.url ?? "/dashboard",
        })
      );
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 410 || status === 404) {
        staleIds.push(row.id as string);
      } else {
        console.warn("[Push] Erreur envoi subscription %s:", row.id, err);
      }
    }
  });

  await Promise.allSettled(sendPromises);

  if (staleIds.length > 0) {
    await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .in("id", staleIds);
    console.log("[Push] %d subscription(s) expirée(s) supprimée(s)", staleIds.length);
  }
}

/**
 * Parse un délai textuel comme "24h", "48h", "72h" en nombre d'heures.
 * Retourne 24 par défaut si le format est inconnu.
 */
export function parseCallbackDelay(delay: string | null | undefined): number {
  if (!delay) return 24;
  const match = /^(\d+)h$/i.exec(delay.trim());
  return match ? parseInt(match[1], 10) : 24;
}
