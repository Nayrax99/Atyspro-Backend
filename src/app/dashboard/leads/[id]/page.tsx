"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Lead, LeadDetailResponse, LeadStatus } from "@/types/lead";
import { LEAD_STATUS_LABELS, formatDelay, formatType } from "@/types/lead";
import { formatPhone } from "@/lib/utils";
import { Phone, MessageCircle, ArrowLeft, Pencil, Check, X } from "lucide-react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge, { type BadgeVariant } from "@/components/ui/Badge";
import ScoreCircle from "@/components/ui/ScoreCircle";
import { useDashboard } from "@/contexts/DashboardContext";

const API_BASE = "";

interface SmsMessage {
  id: string;
  from_number: string | null;
  to_number: string | null;
  direction: string | null;
  body: string | null;
  created_at: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const date = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h");
  return `${date} à ${time}`;
}

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
    deadline = new Date(created);
    deadline.setDate(deadline.getDate() + 7);
  }

  const isPast = deadline < now;
  const dateLabel = isUrgent
    ? created.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : deadline.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  let text = isUrgent ? `Aujourd'hui (${dateLabel})` : `Avant le ${dateLabel}`;
  if (isPast) text += " (dépassée)";
  return { text, isRed: isUrgent || isPast, isGray: false };
}

// Inline-editable field
function EditableField({
  label,
  value,
  onSave,
  placeholder = "Non renseigné",
}: {
  label: string;
  value: string | null | undefined;
  onSave: (val: string) => Promise<void>;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = async () => {
    setSaving(true);
    try {
      await onSave(draft.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setDraft(value ?? "");
    setEditing(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
      {editing ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void commit(); if (e.key === "Escape") cancel(); }}
            disabled={saving}
            style={{
              flex: 1,
              height: 34,
              padding: "0 10px",
              border: "1.5px solid var(--ap-primary)",
              borderRadius: 8,
              fontSize: 13,
              fontFamily: "var(--font-sans)",
              color: "#0F172A",
              outline: "none",
              background: "#fff",
            }}
          />
          <button
            type="button"
            onClick={() => void commit()}
            disabled={saving}
            style={{ width: 30, height: 30, borderRadius: 8, background: "#16A34A", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}
          >
            <Check size={14} />
          </button>
          <button
            type="button"
            onClick={cancel}
            style={{ width: 30, height: 30, borderRadius: 8, background: "#F1F5F9", border: "1px solid #E2E8F0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => setEditing(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            padding: "6px 8px",
            borderRadius: 8,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#F8FAFC"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
        >
          <span style={{ fontSize: 13, color: value ? "#0F172A" : "#9CA3AF", fontStyle: value ? "normal" : "italic" }}>
            {value || placeholder}
          </span>
          <Pencil size={12} color="#CBD5E1" />
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "16px 24px 0", borderTop: "0.5px solid #F1F5F9" }}>
      <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94A3B8", margin: 0, paddingBottom: 14 }}>
        {children}
      </h3>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12, alignItems: "start", padding: "6px 24px" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", paddingTop: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: "#0F172A" }}>{children}</div>
    </div>
  );
}

export default function LeadDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { skin } = useDashboard();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<LeadStatus>("nouveau");
  const [saving, setSaving] = useState(false);
  const [markingProcessed, setMarkingProcessed] = useState(false);
  const [saveMessage, setSaveMessage] = useState<"success" | "error" | null>(null);
  const [smsMessages, setSmsMessages] = useState<SmsMessage[]>([]);
  const [smsLoading, setSmsLoading] = useState(false);

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

    fetch(`${API_BASE}/api/leads/${id}`, { credentials: "include" })
      .then((res) => res.json())
      .then((json: LeadDetailResponse & { error?: string }) => {
        if (cancelled) return;
        if (!json.success) { setError(json.error || "Lead non trouvé"); return; }
        const l = json.data;
        setLead(l);
        setStatus(l.status);
      })
      .catch((err: Error) => { if (!cancelled) setError(err.message || "Erreur réseau"); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [id]);

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

  const patchLead = async (payload: Record<string, unknown>) => {
    const res = await fetch(`${API_BASE}/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    const json = (await res.json()) as { success?: boolean; data?: Lead; error?: string };
    if (json.success && json.data) {
      setLead(json.data);
      setStatus(json.data.status);
      return true;
    }
    return false;
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ok = await patchLead({ status });
    setSaveMessage(ok ? "success" : "error");
    setSaving(false);
  };

  const handleMarkProcessed = async () => {
    setMarkingProcessed(true);
    const ok = await patchLead({ status: "traite" });
    setSaveMessage(ok ? "success" : "error");
    setMarkingProcessed(false);
  };

  const handleSaveField = async (field: string, value: string) => {
    await patchLead({ [field]: value || null });
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
      <div style={{ fontFamily: "var(--font-sans)" }}>
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#64748B", textDecoration: "none", marginBottom: 16 }}>
          <ArrowLeft size={14} /> Retour aux leads
        </Link>
        <div style={{ padding: 16, borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: 13 }}>{error || "Lead non trouvé"}</div>
      </div>
    );
  }

  const deadline = computeDeadline(lead);
  const badgeStatus = lead.status === "a_traiter" ? "a-traiter"
    : lead.status === "incomplet" ? "incomplet"
    : lead.status === "traite" ? "traite"
    : "nouveau";

  void skin;

  return (
    <div style={{ fontFamily: "var(--font-sans)", maxWidth: 820 }}>
      {/* Back + breadcrumb */}
      <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#64748B", textDecoration: "none", marginBottom: 20 }}>
        <ArrowLeft size={14} /> Retour aux leads
      </Link>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>
            {lead.full_name || <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>Inconnu</span>}
          </h1>
          {lead.client_phone && (
            <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>{formatPhone(lead.client_phone)}</div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Badge variant={badgeStatus as BadgeVariant}>{LEAD_STATUS_LABELS[lead.status]}</Badge>
          {lead.priority_score != null && <ScoreCircle score={lead.priority_score} size="md" />}
        </div>
      </div>

      {/* Action buttons */}
      {lead.client_phone && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <a
            href={`tel:${lead.client_phone}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px", borderRadius: 8, background: "var(--ap-primary)", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
          >
            <Phone size={14} /> Appeler
          </a>
          <a
            href={`https://wa.me/${lead.client_phone.replace("+", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px", borderRadius: 8, background: "#25D366", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
          >
            <MessageCircle size={14} /> WhatsApp
          </a>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16, alignItems: "start" }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Identity — inline editable */}
          <Card padding="none">
            <div style={{ padding: "16px 24px 12px" }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94A3B8", margin: 0, paddingBottom: 16 }}>
                Identité
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <EditableField
                  label="Nom complet"
                  value={lead.full_name}
                  onSave={(v) => handleSaveField("full_name", v)}
                  placeholder="Non renseigné"
                />
                <EditableField
                  label="Adresse"
                  value={lead.address}
                  onSave={(v) => handleSaveField("address", v)}
                  placeholder="Non renseignée"
                />
              </div>
            </div>
          </Card>

          {/* Demande */}
          <Card padding="none">
            <div style={{ padding: "16px 24px 20px" }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94A3B8", margin: 0, paddingBottom: 14 }}>
                Demande
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <InfoRow label="Type">{formatType(lead)}</InfoRow>
                <InfoRow label="Délai">{formatDelay(lead)}</InfoRow>
                <InfoRow label="Échéance">
                  <span style={{ color: deadline.isRed ? "#DC2626" : deadline.isGray ? "#94A3B8" : "#0F172A", fontStyle: deadline.isGray ? "italic" : "normal", fontWeight: deadline.isRed ? 600 : 400 }}>
                    {deadline.text}
                  </span>
                </InfoRow>
                <InfoRow label="Valeur estimée">
                  {lead.value_estimate === "high" ? "Élevée"
                    : lead.value_estimate === "medium" ? "Moyenne"
                    : lead.value_estimate === "low" ? "Faible"
                    : <span style={{ color: "#94A3B8", fontStyle: "italic" }}>Non estimée</span>}
                </InfoRow>
                {(lead.description || lead.raw_message) && (
                  <InfoRow label="Message">
                    <span style={{ whiteSpace: "pre-wrap", color: "#374151" }}>
                      {lead.description || lead.raw_message}
                    </span>
                  </InfoRow>
                )}
              </div>
            </div>
          </Card>

          {/* SMS history */}
          <Card padding="none">
            <div style={{ padding: "16px 24px 20px" }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94A3B8", margin: 0, paddingBottom: 14 }}>
                Messages SMS
              </h3>
              {smsLoading ? (
                <LoadingSpinner text="Chargement…" padded={false} />
              ) : smsMessages.length === 0 ? (
                <p style={{ fontSize: 13, color: "#94A3B8", fontStyle: "italic", margin: 0 }}>Aucun message</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {smsMessages.map((msg) => (
                    <div key={msg.id} style={{ padding: "10px 14px", borderRadius: 10, background: msg.direction === "outbound" ? "#F0F9FF" : "#F8FAFC", border: `0.5px solid ${msg.direction === "outbound" ? "#BAE6FD" : "#E5E7EB"}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, letterSpacing: "0.05em",
                          background: msg.direction === "outbound" ? "#0EA5E9" : "#E2E8F0",
                          color: msg.direction === "outbound" ? "#fff" : "#475569",
                        }}>
                          {msg.direction === "outbound" ? "ENVOYÉ" : "REÇU"}
                        </span>
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: "#334155", margin: 0, lineHeight: 1.5 }}>{msg.body || <em>— vide —</em>}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Statut */}
          <Card padding={20}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94A3B8", marginBottom: 14 }}>Statut</div>
            <form onSubmit={(e) => { void handleSaveStatus(e); }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ position: "relative" }}>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LeadStatus)}
                  disabled={saving || markingProcessed}
                  style={{ width: "100%", height: 36, padding: "0 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, fontFamily: "var(--font-sans)", color: "#374151", background: "#fff", appearance: "none", cursor: "pointer", outline: "none" }}
                >
                  {(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map((s) => (
                    <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" variant="primary" size="sm" disabled={saving || markingProcessed} style={{ width: "100%", justifyContent: "center" }}>
                {saving ? "Enregistrement…" : "Enregistrer le statut"}
              </Button>
              {lead.status !== "traite" && (
                <Button type="button" variant="success" size="sm" onClick={() => void handleMarkProcessed()} disabled={markingProcessed || saving} style={{ width: "100%", justifyContent: "center" }}>
                  {markingProcessed ? "En cours…" : "Marquer comme traité"}
                </Button>
              )}
              {saveMessage === "success" && (
                <div style={{ fontSize: 12, color: "#059669", textAlign: "center" }}>Enregistré ✓</div>
              )}
              {saveMessage === "error" && (
                <div style={{ fontSize: 12, color: "#DC2626", textAlign: "center" }}>Erreur lors de la sauvegarde</div>
              )}
            </form>
          </Card>

          {/* Dates */}
          <Card padding={20}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94A3B8", marginBottom: 14 }}>Dates</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 2 }}>Créé le</div>
                <div style={{ fontSize: 12, color: "#374151" }}>{formatDate(lead.created_at)}</div>
              </div>
              {lead.updated_at && (
                <div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 2 }}>Modifié le</div>
                  <div style={{ fontSize: 12, color: "#374151" }}>{formatDate(lead.updated_at)}</div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
