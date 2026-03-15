"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Lead, LeadDetailResponse, LeadStatus } from "@/types/lead";
import { LEAD_STATUS_LABELS, formatDelay, formatType } from "@/types/lead";
import { formatPhone } from "@/lib/utils";
import { Phone, MessageCircle } from "lucide-react";

function getScoreBarClass(score: number | null): string {
  if (score == null) return "lead-score-bar-fill--low";
  if (score >= 70) return "lead-score-bar-fill--high";
  if (score >= 40) return "lead-score-bar-fill--medium";
  return "lead-score-bar-fill--critical";
}

function getScoreTextClass(score: number | null): string {
  if (score == null) return "score-cell--low";
  if (score >= 70) return "score-cell--high";
  if (score >= 40) return "score-cell--medium";
  return "score-cell--critical";
}

const API_BASE = "";

export default function LeadDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<LeadStatus | "">("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<"success" | "error" | null>(
    null,
  );

  // Auto-efface le message de confirmation après 3s
  useEffect(() => {
    if (!saveMessage) return;
    const t = setTimeout(() => setSaveMessage(null), 3000);
    return () => clearTimeout(t);
  }, [saveMessage]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/leads/${id}`)
      .then((res) => res.json())
      .then((json: LeadDetailResponse & { error?: string }) => {
        if (cancelled) return;
        if (!json.success) {
          setError(json.error || "Lead non trouvé");
          setLead(null);
          return;
        }
        const l = json.data;
        setLead(l);
        setStatus(l.status);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Erreur réseau");
          setLead(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !status) return;
    setSaving(true);
    setSaveMessage(null);

    fetch(`${API_BASE}/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
      .then((res) => res.json())
      .then((json: { success?: boolean; data?: Lead; error?: string }) => {
        if (json.success && json.data) {
          setLead(json.data);
          setSaveMessage("success");
        } else {
          setSaveMessage("error");
        }
      })
      .catch(() => setSaveMessage("error"))
      .finally(() => setSaving(false));
  };

  if (loading && !lead) {
    return (
      <div className="dashboard-card">
        <div className="dashboard-loading">Chargement du lead…</div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard" className="lead-detail-back">
          ← Retour aux leads
        </Link>
        <div className="dashboard-error">
          {error || "Lead non trouvé"}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="lead-detail">
        <Link href="/dashboard" className="lead-detail-back">
          ← Retour aux leads
        </Link>

        <div className="dashboard-card">
          <div className="lead-detail-section">
            <div className="lead-detail-header">
              <h2 className="lead-detail-title">
                {lead.full_name || <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Inconnu</span>}
              </h2>
              <span className={`badge badge--${lead.status}`}>
                {LEAD_STATUS_LABELS[lead.status]}
              </span>
            </div>

            {lead.client_phone && (
              <div className="lead-action-buttons">
                <a
                  href={`tel:${lead.client_phone}`}
                  className="lead-action-btn lead-action-btn--call"
                >
                  <Phone size={15} />
                  Appeler
                </a>
                <a
                  href={`https://wa.me/${lead.client_phone.replace("+", "")}`}
                  className="lead-action-btn lead-action-btn--whatsapp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle size={15} />
                  WhatsApp
                </a>
              </div>
            )}

            <form onSubmit={handleSaveStatus} className="lead-status-form" style={{ marginTop: "1rem" }}>
              <label htmlFor="lead-status">Statut</label>
              <select
                id="lead-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                disabled={saving}
              >
                {(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {LEAD_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <button type="submit" disabled={saving}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
              {saveMessage === "success" && (
                <span style={{ color: "#059669", fontSize: "0.9rem" }}>
                  Enregistré
                </span>
              )}
              {saveMessage === "error" && (
                <span style={{ color: "#dc2626", fontSize: "0.9rem" }}>
                  Erreur
                </span>
              )}
            </form>
          </div>

          <div className="lead-detail-section">
            <h3>Contact</h3>
            <div className="lead-detail-field">
              <div className="lead-detail-label">Téléphone</div>
              <div
                className={`lead-detail-value ${
                  !lead.client_phone ? "lead-detail-value--empty" : ""
                }`}
              >
                {lead.client_phone ? formatPhone(lead.client_phone) : "Non renseigné"}
              </div>
            </div>
            <div className="lead-detail-field">
              <div className="lead-detail-label">Adresse</div>
              <div
                className={`lead-detail-value ${
                  !lead.address ? "lead-detail-value--empty" : ""
                }`}
              >
                {lead.address || "Non renseignée"}
              </div>
            </div>
          </div>

          <div className="lead-detail-section">
            <h3>Demande</h3>
            <div className="lead-detail-field">
              <div className="lead-detail-label">Type de prestation</div>
              <div
                className={`lead-detail-value ${
                  !lead.type_code ? "lead-detail-value--empty" : ""
                }`}
              >
                {formatType(lead)}
              </div>
            </div>
            <div className="lead-detail-field">
              <div className="lead-detail-label">Délai souhaité</div>
              <div className="lead-detail-value">{formatDelay(lead)}</div>
            </div>
            <div className="lead-detail-field">
              <div className="lead-detail-label">Score de priorité</div>
              <div className="lead-detail-value lead-score-bar-wrap">
                <div className="lead-score-bar">
                  <div
                    className={`lead-score-bar-fill ${getScoreBarClass(lead.priority_score)}`}
                    style={{ width: `${lead.priority_score ?? 0}%` }}
                  />
                </div>
                <span className={`score-cell ${getScoreTextClass(lead.priority_score)}`}>
                  {lead.priority_score != null ? lead.priority_score : "—"}
                </span>
              </div>
            </div>
            <div className="lead-detail-field">
              <div className="lead-detail-label">Valeur estimée</div>
              <div className="lead-detail-value">
                {lead.value_estimate === "high"
                  ? "Élevée"
                  : lead.value_estimate === "medium"
                    ? "Moyenne"
                    : lead.value_estimate === "low"
                      ? "Faible"
                      : "Non estimée"}
              </div>
            </div>
            <div className="lead-detail-field">
              <div className="lead-detail-label">Description / message</div>
              <div
                className={`lead-detail-value ${
                  !lead.description ? "lead-detail-value--empty" : ""
                }`}
                style={{ whiteSpace: "pre-wrap" }}
              >
                {lead.description || lead.raw_message || "Aucun message"}
              </div>
            </div>
          </div>

          <div className="lead-detail-section">
            <h3>Relances</h3>
            <div className="lead-detail-field">
              <div className="lead-detail-label">Nombre de relances</div>
              <div className="lead-detail-value">
                {lead.relance_count && lead.relance_count > 0 ? (
                  <span className="badge badge--warning">
                    {lead.relance_count} relance
                    {lead.relance_count > 1 ? "s" : ""}
                  </span>
                ) : (
                  "Aucune"
                )}
              </div>
            </div>
          </div>

          <div className="lead-detail-section">
            <h3>Dates</h3>
            <div className="lead-detail-field">
              <div className="lead-detail-label">Créé le</div>
              <div className="lead-detail-value">
                {lead.created_at
                  ? new Date(lead.created_at).toLocaleString("fr-FR")
                  : "—"}
              </div>
            </div>
            {lead.updated_at && (
              <div className="lead-detail-field">
                <div className="lead-detail-label">Modifié le</div>
                <div className="lead-detail-value">
                  {new Date(lead.updated_at).toLocaleString("fr-FR")}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
