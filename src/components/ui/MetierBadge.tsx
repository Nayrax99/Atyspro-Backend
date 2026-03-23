import type { CSSProperties } from "react";
import { getIconBoxStyle, getSkinConfig } from "@/theme";

interface MetierBadgeProps {
  metier: string;
  style?: CSSProperties;
}

export default function MetierBadge({ metier, style }: MetierBadgeProps) {
  const config = getSkinConfig(metier);

  if (!config.metierLabel) return null;

  const iconBoxStyle = getIconBoxStyle(
    (["electricien", "plombier", "serrurier", "immo", "admin"].includes(metier) ? metier : "core") as Parameters<typeof getIconBoxStyle>[0],
    24
  );

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 10px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        background: iconBoxStyle.backgroundColor,
        border: iconBoxStyle.borderColor ? `1px solid ${iconBoxStyle.borderColor}` : undefined,
        color: config.accent,
        fontFamily: "var(--font-sans)",
        ...style,
      }}
    >
      {config.icon && (
        <svg
          width={11}
          height={11}
          viewBox={config.icon.viewBox}
          fill={config.accent}
          style={{ flexShrink: 0 }}
        >
          <path d={config.icon.path} />
        </svg>
      )}
      {config.metierLabel}
    </span>
  );
}
