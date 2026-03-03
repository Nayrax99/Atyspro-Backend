import { NextRequest, NextResponse } from "next/server";
import { getLeadById, updateLeadById } from "@/modules/leads";
import { requireAuth } from "@/lib/auth";
import { createSupabaseClient } from "@/lib/supabase";
import { isValidUuid, ApiError } from "@/lib/utils";

type Ctx = { params: { id: string } | Promise<{ id: string }> };

async function getId(ctx: Ctx): Promise<string> {
  const p = await Promise.resolve(ctx.params);
  return p.id;
}

const ALLOWED_FIELDS = [
  "status",
  "contact_name",
  "phone",
  "address",
  "request_text",
  "urgency",
  "job_type",
  "score",
] as const;

const VALID_STATUSES = ["complete", "incomplete", "needs_review"];

/**
 * GET /api/leads/:id - Get lead by id (authentifié)
 */
export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const { account_id, token } = await requireAuth(request);
    const client = createSupabaseClient(token);
    const id = await getId(ctx);

    if (!isValidUuid(id)) {
      return NextResponse.json(
        { success: false, error: "ID invalide (format UUID requis)" },
        { status: 400 }
      );
    }

    const lead = await getLeadById(client, id, account_id);

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    console.error("Erreur GET /leads/:id:", error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

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
 * PATCH /api/leads/:id - Update lead (authentifié)
 */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const { account_id, token } = await requireAuth(request);
    const client = createSupabaseClient(token);
    const id = await getId(ctx);

    if (!isValidUuid(id)) {
      return NextResponse.json(
        { success: false, error: "ID invalide (format UUID requis)" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const updates: Record<string, unknown> = {};

    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucun champ valide à mettre à jour" },
        { status: 400 }
      );
    }

    if (updates.status !== undefined) {
      if (!VALID_STATUSES.includes(updates.status as string)) {
        return NextResponse.json(
          {
            success: false,
            error: `Status invalide. Valeurs autorisées: ${VALID_STATUSES.join(", ")}`,
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

    const updatedLead = await updateLeadById(client, id, account_id, updates);

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

    if (error instanceof ApiError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
