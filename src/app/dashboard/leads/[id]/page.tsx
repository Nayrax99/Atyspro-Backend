"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Lead, LeadDetailResponse, LeadStatus } from "@/types/lead";
import { LEAD_STATUS_LABELS, formatDelay, formatType } from "@/types/lead";
import { formatPhone } from "@/lib/utils";
import { Phone, MessageCircle } from "lucide-react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const API_BASE = "";
const FONT = "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif";

interface SmsMessage {
  id: string;
  from_number: string | null;
  to_number: string | null;
  direction: string | null;
  body: string | null;
  created_at: string;
}

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

const STATUS_BADGE_CLASSES: Record<LeadStatus, string> = {
  new: "badge badge--neutral",
  incomplete: "badge badge--danger",
  to_process: "badge badge--warning",
  processed: "badge badge--success",
};

/** Computes the estimated deadline from delay_code + created_at */
function computeDeadline(lead: Lead): { text: string; isRed: boolean; isGray: boolean } {
  if (!lead.delay_code) return { text: "Non renseigné", isRed: false, isGray: true };
  if (lead.delay_code === 4) return { text: "Pas de date limite", isRed: false, isGray: true };

  const created = new Date(lead.created_at);
  const now = new Date();
  const isUrgent = lead.delay_code === 1;

  let deadline: Date;
  if (isUrgent) {
    deadline = new Date(created);
    deadline.setHours(23, 59, 59, 999);
  } else if (lead.delay_code === 2) {
    deadline = new Date(created);
    deadline.setDate(deadline.getDate() + 2);
  } else {
    // delay_code === 3
    deadline = new Date(created);
    deadline.setDate(deadline.getDate() + 7);
  }

  const isPast = deadline < now;
  const dateLabel = isUrgent
    ? created.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : deadline.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  let text = isUrgent
    ? `Aujourd'hui (${dateLabel})`
    : `Avant le ${dateLabel}`;
  if (isPast) text += " (dépassée)";

  return { text, isRed: isUrgent || isPast, isGray: false };
}

export default function LeadDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<LeadStatus>("new");
  const [saving, setSaving] = useState(false);
  const [markingProcessed, setMarkingProcessed] = useState(false);
  const [saveMessage, setSaveMessage] = useState<"success" | "error" | null>(null);
  const [markHovered, setMarkHovered] = useState(false);

  const [smsMessages, setSmsMessages] = useState<SmsMessage[]>([]);
  const [smsLoading, setSmsLoading] = useState(false);

  // Auto-clear save message after 3s
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

    return () => { cancelled = true; };
  }, [id]);

  // Fetch SMS history
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setSmsLoading(true);

    fetch(`${API_BASE}/api/leads/${id}/sms`, { credentials: "include" })
      .then((r) => r.json())
      .then((json: { success: boolean; data?: SmsMessage[] }) => {
        if (cancelled) return;
        if (json.success) setSmsMessages(json.data ?? []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setSmsLoading(false); });

    return () => { cancelled = true; };
  }, [id]);

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
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

  const handleMarkProcessed = () => {
    if (!id) return;
    setMarkingProcessed(true);
    setSaveMessage(null);

    fetch(`${API_BASE}/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "processed" }),
    })
      .then((res) => res.json())
      .then((json: { success?: boolean; data?: Lead; error?: string }) => {
        if (json.success && json.data) {
          setLead(json.data);
          setStatus("processed");
          setSaveMessage("success");
        } else {
          setSaveMessage("error");
        }
      })
      .catch(() => setSaveMessage("error"))
      .finally(() => setMarkingProcessed(false));
  };

  if (loading && !lead) {
    return (
      <Card padding={32}>
        <LoadingSpinner text="Chargement du lead…" />
      </Card>
    );
  }

  if (error || !lead) {
    return (
      <div style={{ maxWidth: "768px", margin: "0 auto", fontFamily: FONT }}>
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 600, color: "#64748b", textDecoration: "none", marginBottom: "16px" }}>
          ← Retour aux leads
        </Link>
        <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "14px" }}>{error || "Lead non trouvé"}</div>
      </div>
    );
  }

  const deadline = computeDeadline(lead);

  return (
    <div style={{ maxWidth: "768px", margin: "0 auto", fontFamily: FONT }}>
      <div>
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 600, color: "#64748b", textDecoration: "none", marginBottom: "16px" }}>
          ← Retour aux leads
        </Link>

        <Card padding="none">
          {/* Header: name + status badge */}
          <div className="lead-detail-section">
            <div className="lead-detail-header">
              <h2 className="lead-detail-title">
                {lead.full_name || (
                  <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Inconnu</span>
                )}
              </h2>
              <span className={STATUS_BADGE_CLASSES[lead.status]}>
                {LEAD_STATUS_LABELS[lead.status]}
              </span>
            </div>

            {lead.client_phone && (
              <div className="lead-action-buttons">
                <a href={`tel:${lead.client_phone}`} className="lead-action-btn lead-action-btn--call">
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

            {/* Status form + mark-processed button */}
            <form onSubmit={handleSaveStatus} style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
              <label htmlFor="lead-status" style={{ fontSize: "13px", fontWeight: 600, color: "#374151", fontFamily: FONT }}>Statut</label>
              <select
                id="lead-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                disabled={saving || markingProcessed}
                style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", fontFamily: FONT, color: "#374151", backgroundColor: "white", cursor: "pointer", outline: "none" }}
              >
                {(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map((s) => (
                  <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={saving || markingProcessed}
                style={{
                  backgroundColor: "#2563eb",
                  color: "white",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  fontWeight: 600,
                  fontSize: "14px",
                  border: "none",
                  cursor: saving || markingProcessed ? "not-allowed" : "pointer",
                  fontFamily: FONT,
                }}
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>

              {/* Mark as processed */}
              {lead.status !== "processed" && (
                <button
                  type="button"
                  onClick={handleMarkProcessed}
                  disabled={markingProcessed || saving}
                  style={{
                    backgroundColor: "#16a34a",
                    color: "white",
                    borderRadius: "8px",
                    padding: "10px 24px",
                    fontWeight: 600,
                    fontSize: "14px",
                    border: "none",
                    cursor: markingProcessed || saving ? "not-allowed" : "pointer",
                    fontFamily: FONT,
                  }}
                >
                  {markingProcessed ? "En cours…" : "Marquer comme traité"}
                </button>
              )}

              {saveMessage === "success" && (
                <span style={{ color: "#059669", fontSize: "13px", fontFamily: FONT }}>Enregistré ✓</span>
              )}
              {saveMessage === "error" && (
                <span style={{ color: "#dc2626", fontSize: "13px", fontFamily: FONT }}>Erreur</span>
              )}
            </form>
          </div>

          {/* Contact */}
          <div className="lead-detail-section">
            <h3>Contact</h3>
            <div className="lead-detail-field">
              <div className="lead-detail-label">Téléphone</div>
              <div className={`lead-detail-value ${!lead.client_phone ? "lead-detail-value--empty" : ""}`}>
                {lead.client_phone ? formatPhone(lead.client_phone) : "Non renseigné"}
              </div>
            </div>
            <div className="lead-detail-field">
              <div className="lead-detail-label">Adresse</div>
              <div className={`lead-detail-value ${!lead.address ? "lead-detail-value--empty" : ""}`}>
                {lead.address || "Non renseignée"}
              </div>
            </div>
          </div>

          {/* Demande */}
          <div className="lead-detail-section">
            <h3>Demande</h3>
            <div className="lead-detail-field">
              <div className="lead-detail-label">Type de prestation</div>
              <div className={`lead-detail-value ${!lead.type_code ? "lead-detail-value--empty" : ""}`}>
                {formatType(lead)}
              </div>
            </div>
            <div className="lead-detail-field">
              <div className="lead-detail-label">Délai souhaité</div>
              <div className="lead-detail-value">{formatDelay(lead)}</div>
            </div>
            <div className="lead-detail-field">
              <div className="lead-detail-label">Date limite estimée</div>
              <div
                className="lead-detail-value"
                style={{
                  color: deadline.isRed ? "#dc2626" : deadline.isGray ? "#94a3b8" : undefined,
                  fontStyle: deadline.isGray ? "italic" : undefined,
                  fontWeight: deadline.isRed ? 600 : undefined,
                }}
              >
                {deadline.text}
              </div>
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
                className={`lead-detail-value ${!lead.description ? "lead-detail-value--empty" : ""}`}
                style={{ whiteSpace: "pre-wrap" }}
              >
                {lead.description || lead.raw_message || "Aucun message"}
              </div>
            </div>
          </div>

          {/* Relances */}
          <div className="lead-detail-section">
            <h3>Relances</h3>
            <div className="lead-detail-field">
              <div className="lead-detail-label">Nombre de relances</div>
              <div className="lead-detail-value">
                {lead.relance_count && lead.relance_count > 0 ? (
                  <span className="badge badge--warning">
                    {lead.relance_count} relance{lead.relance_count > 1 ? "s" : ""}
                  </span>
                ) : (
                  "Aucune"
                )}
              </div>
            </div>
          </div>

          {/* SMS Messages */}
          <div className="lead-detail-section">
            <h3>Messages</h3>
            {smsLoading ? (
              <LoadingSpinner text="Chargement des messages…" padded={false} />
            ) : smsMessages.length === 0 ? (
              <p className="lead-detail-value--empty" style={{ fontSize: "0.875rem" }}>
                Aucun message
              </p>
            ) : (
              <div className="sms-history">
                {smsMessages.map((msg) => (
                  <div key={msg.id} className="sms-message-row">
                    <div className="sms-message-meta">
                      <span
                        className={`badge ${
                          msg.direction === "outbound"
                            ? "badge--sms-outbound"
                            : "badge--sms-inbound"
                        }`}
                      >
                        {msg.direction === "outbound" ? "Envoyé" : "Reçu"}
                      </span>
                      <span className="sms-message-date">
                        {new Date(msg.created_at).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="sms-message-body">{msg.body || <em>— vide —</em>}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="lead-detail-section">
            <h3>Dates</h3>
            <div className="lead-detail-field">
              <div className="lead-detail-label">Créé le</div>
              <div className="lead-detail-value">
                {lead.created_at ? new Date(lead.created_at).toLocaleString("fr-FR") : "—"}
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
        </Card>
      </div>
    </div>
  );
}
