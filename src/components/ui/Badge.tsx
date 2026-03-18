import type { ReactNode, CSSProperties } from "react";

export type BadgeVariant =
  | "a-traiter"
  | "incomplet"
  | "traite"
  | "urgent"
  | "nouveau"
  | "relance";

const BADGE_STYLES: Record<BadgeVariant, CSSProperties> = {
  "a-traiter": {
    background: "var(--ap-primary-light)",
    color: "var(--ap-primary)",
    border: "0.5px solid var(--ap-primary-border)",
  },
  incomplet: {
    background: "#F3F4F6",
    color: "#6B7280",
    border: "0.5px solid #D1D5DB",
  },
  traite: {
    background: "#F0FDF4",
    color: "#16A34A",
    border: "0.5px solid #BBF7D0",
  },
  urgent: {
    background: "#FEF2F2",
    color: "#DC2626",
    border: "0.5px solid #FECACA",
  },
  nouveau: {
    background: "var(--ap-primary)",
    color: "#fff",
    border: "none",
  },
  relance: {
    background: "#FFFBEB",
    color: "#D97706",
    border: "0.5px solid #FDE68A",
  },
};

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  style?: CSSProperties;
}

export default function Badge({ variant, children, style }: BadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 10,
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: 5,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        fontFamily: "var(--font-sans)",
        ...BADGE_STYLES[variant],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
