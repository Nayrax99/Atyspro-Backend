import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

/**
 * Route GET /leads
 * Récupère la liste des leads paginée et triée
 * Tri: score desc puis created_at desc
 */
export async function GET(request: NextRequest) {
  try {
    // Récupérer les paramètres de pagination depuis la query string
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Validation basique
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Paramètres invalides (page >= 1, limit 1-100)",
        },
        { status: 400 }
      );
    }

    // Calculer l'offset pour la pagination
    const offset = (page - 1) * limit;

    // Récupérer les leads avec tri et pagination
    const { data: leads, error, count } = await supabase
      .from("leads")
      .select("*", { count: "exact" })
      .order("score", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Erreur Supabase: ${error.message}`);
    }

    // Calculer les métadonnées de pagination
    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json({
      success: true,
      data: leads || [],
      pagination: {
        page,
        limit,
        total: count || 0,
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