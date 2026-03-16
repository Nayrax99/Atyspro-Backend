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

const FONT = "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif";

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: FONT }}>
      {/* Left branding panel — hidden on mobile via className */}
      <div
        className="hidden lg:flex lg:w-[46%] xl:w-2/5"
        style={{
          position: "relative",
          flexDirection: "column",
          justifyContent: "center",
          gap: "3.25rem",
          paddingTop: "3.5rem",
          paddingBottom: "3.5rem",
          paddingLeft: "3.75rem",
          paddingRight: "3.75rem",
          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 45%, #4f46e5 100%)",
          overflow: "hidden",
        }}
        aria-hidden="true"
      >
        {/* Overlay texture radial */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 50%)",
            pointerEvents: "none",
          }}
        />
        {/* Second subtle highlight */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 80% 10%, rgba(255,255,255,0.05) 0%, transparent 40%)",
            pointerEvents: "none",
          }}
        />

        {/* Logo */}
        <div style={{ position: "relative" }}>
          <span style={{ fontSize: "24px", fontWeight: 800, color: "white", letterSpacing: "-0.02em", fontFamily: FONT }}>
            AtysPro
          </span>
        </div>

        {/* Central pitch */}
        <div style={{ position: "relative" }}>
          {/* Decorative bar */}
          <div
            style={{
              width: "40px",
              height: "3px",
              borderRadius: "999px",
              backgroundColor: "rgba(255,255,255,0.65)",
              marginBottom: "24px",
            }}
          />
          <h1
            style={{
              fontSize: "clamp(2.5rem, 3.7vw, 3.25rem)",
              fontWeight: "800",
              lineHeight: "1.15",
              letterSpacing: "-0.02em",
              color: "white",
              marginBottom: "1.1rem",
            }}
          >
            Ne manquez plus<br />aucun client.
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "rgba(219, 234, 254, 0.82)",
              lineHeight: "1.7",
              maxWidth: "360px",
              marginBottom: "2.5rem",
            }}
          >
            Votre assistant vocal qualifie vos appels manqués et génère des leads
            prêts à rappeler — même quand vous n&apos;êtes pas disponible.
          </p>

          {/* Feature list */}
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "18px" }}>
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span
                  style={{
                    display: "flex",
                    width: "44px",
                    height: "44px",
                    flexShrink: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    backgroundColor: "rgba(15,23,42,0.15)",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <Icon size={18} color="white" />
                </span>
                <span style={{ fontSize: "15px", color: "rgba(219, 234, 254, 0.9)" }}>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer quote */}
        <p
          style={{
            fontSize: "12px",
            color: "rgba(219, 234, 254, 0.55)",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            paddingTop: "24px",
            position: "relative",
          }}
        >
          Pour tous les professionnels qui ne peuvent pas se permettre de rater un appel.
        </p>
      </div>

      {/* Right form panel */}
      <div
        className="flex-1"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          padding: "2.5rem 1.5rem",
          fontFamily: FONT,
        }}
      >
        {children}
      </div>
    </div>
  );
}
