import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createSupabaseClient } from "@/lib/supabase";
import { ApiError } from "@/lib/utils";

/**
 * POST /api/push/subscribe — Enregistre une push subscription Web
 * Body: { subscription: PushSubscriptionJSON, platform?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { account_id, token } = await requireAuth(request);
    const client = createSupabaseClient(token);

    const body = (await request.json()) as {
      subscription?: unknown;
      platform?: string;
    };

    if (!body.subscription || typeof body.subscription !== "object") {
      return NextResponse.json(
        { success: false, error: "subscription requis" },
        { status: 400 }
      );
    }

    const sub = body.subscription as { endpoint?: string };
    if (!sub.endpoint || typeof sub.endpoint !== "string") {
      return NextResponse.json(
        { success: false, error: "subscription.endpoint invalide" },
        { status: 400 }
      );
    }

    const platform = body.platform ?? "web";

    const { error } = await client
      .from("push_subscriptions")
      .upsert(
        {
          account_id,
          endpoint: sub.endpoint,
          subscription: body.subscription,
          platform,
        },
        { onConflict: "account_id,endpoint" }
      );

    if (error) throw new Error(error.message);

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

/**
 * DELETE /api/push/subscribe — Supprime une push subscription par endpoint
 * Body: { endpoint: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const { account_id, token } = await requireAuth(request);
    const client = createSupabaseClient(token);

    const body = (await request.json()) as { endpoint?: string };
    if (!body.endpoint) {
      return NextResponse.json(
        { success: false, error: "endpoint requis" },
        { status: 400 }
      );
    }

    const { error } = await client
      .from("push_subscriptions")
      .delete()
      .eq("account_id", account_id)
      .eq("endpoint", body.endpoint);

    if (error) throw new Error(error.message);

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
