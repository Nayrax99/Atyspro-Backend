import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const ACCOUNT_ID = "1b56da95-e451-415a-b8ed-b37dbbf01a48";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== "DEBUG123") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "supabaseAdmin unavailable" }, { status: 500 });
  }

  const { data: account, error: accountError } = await supabaseAdmin
    .from("accounts")
    .select("welcome_message, assistant_name, specialty")
    .eq("id", ACCOUNT_ID)
    .single();

  if (accountError || !account) {
    return NextResponse.json({ error: "Account not found", detail: accountError }, { status: 404 });
  }

  const assistantName = (account.assistant_name as string | null) ?? "Maya";
  const welcomeGreeting =
    (account.welcome_message as string | null) ??
    "Bonjour, je suis Maya, comment puis-je vous aider ?";
  const specialty = (account.specialty as string | null) ?? "";

  const wsUrl = `wss://${process.env.RAILWAY_WS_URL}/ws?accountId=${ACCOUNT_ID}&specialty=${encodeURIComponent(specialty)}&assistantName=${encodeURIComponent(assistantName)}`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay url="${wsUrl}" welcomeGreeting="${welcomeGreeting}" language="fr-FR" />
  </Connect>
</Response>`;

  let railwayHealth: { status: number; ok: boolean } = { status: 0, ok: false };
  try {
    const healthRes = await fetch(`https://${process.env.RAILWAY_WS_URL}/health`);
    railwayHealth = { status: healthRes.status, ok: healthRes.ok };
  } catch {
    railwayHealth = { status: 0, ok: false };
  }

  return NextResponse.json({
    twiml,
    railwayHealth,
    wsUrl,
    railwayWsUrl: process.env.RAILWAY_WS_URL ?? null,
  });
}
