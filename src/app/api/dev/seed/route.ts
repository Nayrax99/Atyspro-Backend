import { NextResponse } from "next/server";
import { seedDev } from "@/modules/dev";

/**
 * POST /api/dev/seed - Seed dev data (DEV ONLY)
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, error: "Endpoint désactivé en production" },
      { status: 403 }
    );
  }

  try {
    const data = await seedDev();

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
    console.error("Erreur seed DEV:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
