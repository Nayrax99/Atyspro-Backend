import { NextRequest, NextResponse } from "next/server";
import { listLeads } from "@/modules/leads";

/**
 * GET /api/leads - List leads paginated
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Paramètres invalides (page >= 1, limit 1-100)",
        },
        { status: 400 }
      );
    }

    const { leads, count, totalPages } = await listLeads({ page, limit });

    return NextResponse.json({
      success: true,
      data: leads,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Erreur GET /leads:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
