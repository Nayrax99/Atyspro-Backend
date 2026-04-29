/**
 * Endpoint debug pour tester VoxtralTTS en isolation.
 * Protégé par X-Debug-Key — no-op si DEBUG_KEY non défini (prod safe).
 *
 * GET  /api/dev/test-voxtral?action=list  → liste des voix Voxtral
 * POST /api/dev/test-voxtral?action=synth → synthèse audio (retourne audio/mpeg)
 */
import { NextRequest, NextResponse } from "next/server";
import { synthesizeWithVoxtral, listVoxtralVoices } from "@/lib/voxtralTTS";

/** Vérifie X-Debug-Key — retourne null si OK, NextResponse d'erreur sinon */
function checkAuth(req: NextRequest): NextResponse | null {
  const debugKey = process.env.DEBUG_KEY;
  if (!debugKey) return NextResponse.json(null, { status: 404 });
  if (req.headers.get("x-debug-key") !== debugKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authError = checkAuth(req);
  if (authError) return authError;

  if (req.nextUrl.searchParams.get("action") !== "list") {
    return NextResponse.json({ error: "action=list requis" }, { status: 400 });
  }

  try {
    const voices = await listVoxtralVoices();
    return NextResponse.json({ voices });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authError = checkAuth(req);
  if (authError) return authError;

  if (req.nextUrl.searchParams.get("action") !== "synth") {
    return NextResponse.json({ error: "action=synth requis" }, { status: 400 });
  }

  let body: { text?: unknown; voiceId?: unknown };
  try {
    body = (await req.json()) as { text?: unknown; voiceId?: unknown };
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (typeof body.text !== "string" || !body.text) {
    return NextResponse.json({ error: "text requis (string)" }, { status: 400 });
  }
  if (typeof body.voiceId !== "string" || !body.voiceId) {
    return NextResponse.json({ error: "voiceId requis (string)" }, { status: 400 });
  }
  if (body.text.length > 500) {
    return NextResponse.json({ error: "text trop long (max 500 caractères)" }, { status: 400 });
  }

  try {
    const result = await synthesizeWithVoxtral({ text: body.text, voiceId: body.voiceId });
    const audioBuffer = Buffer.from(result.audioBase64, "base64");
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audioBuffer.length),
        "X-Voxtral-Duration-Ms": String(result.durationMs),
        "X-Voxtral-Characters": String(result.characters),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
