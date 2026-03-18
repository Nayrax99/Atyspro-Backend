import type { ReactNode, CSSProperties } from "react";

type CardPadding = number | string | "none";

interface CardProps {
  children: ReactNode;
  padding?: CardPadding;
  style?: CSSProperties;
  className?: string;
}

export default function Card({ children, padding, style, className }: CardProps) {
  const resolvedPadding = padding === "none" ? 0 : padding ?? 24;

  return (
    <div
      className={className}
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "0.5px solid #E5E7EB",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
        padding: resolvedPadding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
