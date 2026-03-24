import { NextRequest, NextResponse } from "next/server";
import { listLeads } from "@/modules/leads";
import { requireAuth } from "@/lib/auth";
import { createSupabaseClient } from "@/lib/supabase";
import { ApiError } from "@/lib/utils";

const TYPE_LABELS: Record<number, string> = {
  1: "Dépannage",
  2: "Installation",
  3: "Devis",
  4: "Autre",
};

const DELAY_LABELS: Record<number, string> = {
  1: "Urgent (aujourd'hui)",
  2: "48h",
  3: "Cette semaine",
  4: "Flexible",
};

const STATUS_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  a_traiter: "À traiter",
  incomplet: "Incomplet",
  traite: "Traité",
};

function escapeCSV(value: string | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * GET /api/leads - List leads paginated (authentifié)
 * Query params: format=csv pour export CSV complet (max 1000)
 */
export async function GET(request: NextRequest) {
  try {
    const { account_id, token } = await requireAuth(request);
    const client = createSupabaseClient(token);

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format");
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    // "active" is a virtual filter for new + incomplete + to_process
    const ACTIVE_STATUSES = ["nouveau", "incomplet", "a_traiter"];
    const validStatuses = ["nouveau", "incomplet", "a_traiter", "traite", "active"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Statut invalide" },
        { status: 400 }
      );
    }

    // Export CSV — retourne tous les leads correspondant au filtre (max 1000, sans pagination)
    if (format === "csv") {
      const isActiveFilter = status === "active";

      let query = client
        .from("leads")
        .select("full_name, contact_name, client_phone, phone, type_code, delay_code, priority_score, status, address, transcript, created_at")
        .eq("account_id", account_id)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (isActiveFilter) {
        query = query.in("status", ACTIVE_STATUSES);
      } else if (status) {
        query = query.eq("status", status);
      }

      if (search?.trim()) {
        const s = `%${search.trim()}%`;
        query = query.or(`full_name.ilike.${s},client_phone.ilike.${s},address.ilike.${s}`);
      }

      const { data: leads, error } = await query;
      if (error) throw new Error(error.message);

      const rows = (leads || []) as Array<{
        full_name: string | null;
        contact_name: string | null;
        client_phone: string | null;
        phone: string | null;
        type_code: number | null;
        delay_code: number | null;
        priority_score: number | null;
        status: string | null;
        address: string | null;
        transcript: string | null;
        created_at: string | null;
      }>;

      const header = ["Nom", "Téléphone", "Type", "Délai", "Score", "Statut", "Adresse", "Transcription", "Date"].join(",");
      const lines = rows.map((l) => {
        const nom = escapeCSV(l.full_name || l.contact_name);
        const tel = escapeCSV(l.client_phone || l.phone);
        const type = escapeCSV(l.type_code != null ? (TYPE_LABELS[l.type_code] ?? "Non renseigné") : "Non renseigné");
        const delai = escapeCSV(l.delay_code != null ? (DELAY_LABELS[l.delay_code] ?? "Non renseigné") : "Non renseigné");
        const score = escapeCSV(l.priority_score != null ? String(l.priority_score) : "");
        const statut = escapeCSV(l.status ? (STATUS_LABELS[l.status] ?? l.status) : "");
        const adresse = escapeCSV(l.address);
        const transcription = escapeCSV(l.transcript);
        const date = escapeCSV(l.created_at ? new Date(l.created_at).toLocaleDateString("fr-FR") : "");
        return [nom, tel, type, delai, score, statut, adresse, transcription, date].join(",");
      });

      const csv = [header, ...lines].join("\n");

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="demandes.csv"',
        },
      });
    }

    // Réponse JSON paginée (comportement par défaut)
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

    const isActiveFilter = status === "active";
    const { leads, count, totalPages } = await listLeads(client, {
      account_id,
      page,
      limit,
      status: isActiveFilter ? undefined : status,
      statuses: isActiveFilter ? ACTIVE_STATUSES : undefined,
      search,
    });

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
