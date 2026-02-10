import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

type Ctx = { params: { id: string } | Promise<{ id: string }> };

async function getId(ctx: Ctx): Promise<string> {
  const p = await Promise.resolve(ctx.params);
  return p.id;
}

// Validation UUID basique
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Route GET /api/leads/:id
 * Récupère le détail d'un lead spécifique
 */
export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const id = await getId(ctx);

    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: "ID invalide (format UUID requis)" },
        { status: 400 }
      );
    }

    const { data: lead, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Erreur Supabase: ${error.message}`);
    }

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    console.error("Erreur GET /leads/:id:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

/**
 * Route PATCH /api/leads/:id
 * Met à jour un lead (status + champs éditables)
 */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const id = await getId(ctx);

    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: "ID invalide (format UUID requis)" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const allowedFields = [
      "status",
      "contact_name",
      "phone",
      "address",
      "request_text",
      "urgency",
      "job_type",
      "score",
    ] as const;

    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucun champ valide à mettre à jour" },
        { status: 400 }
      );
    }

    if (updates.status !== undefined) {
      const validStatuses = ["complete", "incomplete", "needs_review"];
      if (!validStatuses.includes(updates.status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Status invalide. Valeurs autorisées: ${validStatuses.join(", ")}`,
          },
          { status: 400 }
        );
      }
    }

    if (updates.urgency !== undefined) {
      if (
        typeof updates.urgency !== "number" ||
        updates.urgency < 0 ||
        updates.urgency > 10
      ) {
        return NextResponse.json(
          { success: false, error: "Urgency doit être un nombre entre 0 et 10" },
          { status: 400 }
        );
      }
    }

    if (updates.score !== undefined) {
      if (
        typeof updates.score !== "number" ||
        updates.score < 0 ||
        updates.score > 100
      ) {
        return NextResponse.json(
          { success: false, error: "Score doit être un nombre entre 0 et 100" },
          { status: 400 }
        );
      }
    }

    const { data: updatedLead, error } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Erreur Supabase: ${error.message}`);
    }

    if (!updatedLead) {
      return NextResponse.json(
        { success: false, error: "Lead non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Lead mis à jour avec succès",
      data: updatedLead,
    });
  } catch (error) {
    console.error("Erreur PATCH /leads/:id:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
