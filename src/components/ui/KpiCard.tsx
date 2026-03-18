"use client";

import { useState, type ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  accentColor?: string;
  animationDelay?: number;
}

export default function KpiCard({ label, value, delta, accentColor = "var(--ap-primary)", animationDelay = 0 }: KpiCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: 14,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        transition: "box-shadow 0.2s, transform 0.2s",
        boxShadow: hovered
          ? "0 8px 24px rgba(15,23,42,0.10)"
          : "0 1px 3px rgba(15,23,42,0.06)",
        transform: hovered ? "translateY(-2px)" : "none",
        animation: `ap-slide-up 0.4s ease both`,
        animationDelay: `${animationDelay}ms`,
        fontFamily: "var(--font-sans)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Accent bar */}
      <div
        style={{
          width: 24,
          height: 3,
          borderRadius: 2,
          background: accentColor,
        }}
      />
      {/* Label */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#9CA3AF",
        }}
      >
        {label}
      </span>
      {/* Value */}
      <span
        style={{
          fontSize: 30,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: "-0.03em",
          color: "#0F172A",
        }}
      >
        {value}
      </span>
      {/* Delta */}
      {delta && (
        <span style={{ fontSize: 11, color: "#6B7280" }}>{delta}</span>
      )}
    </div>
  );
}
