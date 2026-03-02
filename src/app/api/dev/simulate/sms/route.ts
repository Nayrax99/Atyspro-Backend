import { NextRequest, NextResponse } from "next/server";
import { simulateSms } from "@/modules/dev";

/**
 * POST /api/dev/simulate/sms - Simulate incoming SMS (DEV ONLY)
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const to = typeof body.to === "string" ? body.to.trim() : null;
    const from = typeof body.from === "string" ? body.from.trim() : null;
    const smsBody = typeof body.body === "string" ? body.body : null;

    if (!to || !from || !smsBody) {
      return NextResponse.json(
        { success: false, error: "Body must have to, from, body (strings)" },
        { status: 400 }
      );
    }

    const lead = await simulateSms({ to, from, body: smsBody });

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("Erreur simulate SMS:", error);

    const message = error instanceof Error ? error.message : "Erreur inconnue";

    if (message.startsWith("Numéro professionnel non trouvé")) {
      return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
