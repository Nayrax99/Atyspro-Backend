import type { ReactNode } from "react";
import { Phone, Target, BarChart3 } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
}

const FEATURES = [
  { icon: Phone, label: "Capture automatique des appels manqués" },
  { icon: Target, label: "Leads qualifiés avec score de priorité" },
  { icon: BarChart3, label: "Dashboard en temps réel" },
];

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "var(--font-sans, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif)" }}>
      {/* Left branding panel */}
      <div
        className="hidden lg:flex lg:w-[46%] xl:w-2/5"
        style={{
          position: "relative",
          flexDirection: "column",
          justifyContent: "center",
          gap: "3rem",
          padding: "3.5rem 3.75rem",
          background: "#0D1B38",
          overflow: "hidden",
        }}
        aria-hidden="true"
      >
        {/* Animated grid */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          animation: "ap-grid-drift 20s linear infinite",
          pointerEvents: "none",
        }} />

        {/* Orb 1 */}
        <div style={{
          position: "absolute",
          top: "15%",
          left: "20%",
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
          animation: "ap-orb-float 8s ease-in-out infinite",
          pointerEvents: "none",
        }} />
        {/* Orb 2 */}
        <div style={{
          position: "absolute",
          bottom: "10%",
          right: "5%",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14,165,233,0.2) 0%, transparent 70%)",
          animation: "ap-orb-float 10s ease-in-out infinite reverse",
          pointerEvents: "none",
        }} />

        {/* Logo */}
        <div style={{ position: "relative" }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>AtysPro</span>
        </div>

        {/* Pitch */}
        <div style={{ position: "relative" }}>
          <div style={{ width: 36, height: 3, borderRadius: 999, background: "rgba(99,102,241,0.8)", marginBottom: 22 }} />
          <h1 style={{ fontSize: "clamp(2.2rem, 3.5vw, 3rem)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.025em", color: "#fff", marginBottom: "1rem" }}>
            Ne manquez plus<br />
            <span style={{ background: "linear-gradient(135deg, #5B9BFF, #1A56DB)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              aucun client.
            </span>
          </h1>
          <p style={{ fontSize: 15, color: "rgba(203,213,225,0.80)", lineHeight: 1.7, maxWidth: 340, marginBottom: "2.25rem" }}>
            Votre assistant vocal qualifie vos appels manqués et génère des leads
            prêts à rappeler — même quand vous n&apos;êtes pas disponible.
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ display: "flex", width: 40, height: 40, flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(4px)" }}>
                  <Icon size={17} color="white" />
                </span>
                <span style={{ fontSize: 14, color: "rgba(203,213,225,0.88)" }}>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p style={{ fontSize: 11, color: "rgba(203,213,225,0.45)", borderTop: "1px solid rgba(255,255,255,0.10)", paddingTop: 20, position: "relative" }}>
          Pour tous les professionnels qui ne peuvent pas se permettre de rater un appel.
        </p>
      </div>

      {/* Right form panel */}
      <div
        className="flex-1"
        style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff", padding: "2.5rem 1.5rem" }}
      >
        {children}
      </div>
    </div>
  );
}
