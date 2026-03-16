import type { ReactNode } from "react";

type CardPadding = number | string | "none";

export default function Card({
  children,
  className = "",
  padding,
}: {
  children: ReactNode;
  className?: string;
  padding?: CardPadding;
}) {
  const resolvedPadding = padding === "none" ? 0 : padding ?? 24;

  return (
    <div
      className={[
        "bg-white rounded-[12px] border border-[#E2E8F0] overflow-hidden",
        "shadow-[0_4px_12px_rgba(0,0,0,0.05)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ padding: resolvedPadding }}
    >
      {children}
    </div>
  );
}

