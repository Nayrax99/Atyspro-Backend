import { NextResponse } from "next/server";
import { seedDb } from "@/modules/health";

/**
 * POST /api/health/db - Seed DB (health endpoint, uses maybeSingle)
 */
export async function POST() {
  try {
    const data = await seedDb();

    return NextResponse.json(
      {
        success: true,
        message: "Seed DEV créé avec succès",
        data: {
          account: data.account,
          phone_number: data.phone_number,
          leads: data.leads,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
