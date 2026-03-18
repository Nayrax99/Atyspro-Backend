"use client";

import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "dark" | "ghost" | "whatsapp" | "success" | "danger" | "secondary";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const SIZE_STYLES: Record<ButtonSize, React.CSSProperties> = {
  sm: { height: 28, padding: "0 10px", fontSize: 11 },
  md: { height: 36, padding: "0 14px", fontSize: 13 },
  lg: { height: 44, padding: "0 18px", fontSize: 14 },
};

const VARIANT_BASE: Record<ButtonVariant, React.CSSProperties> = {
  primary:   { background: "var(--ap-primary)",   color: "#fff", border: "none" },
  dark:      { background: "#0F172A",              color: "#fff", border: "none" },
  ghost:     { background: "#fff",                 color: "#4B5563", border: "0.5px solid #E5E7EB" },
  secondary: { background: "#F1F5F9",              color: "#0F172A", border: "1px solid #E2E8F0" },
  whatsapp:  { background: "#25D366",              color: "#fff", border: "none" },
  success:   { background: "#16A34A",              color: "#fff", border: "none" },
  danger:    { background: "#DC2626",              color: "#fff", border: "none" },
};

const VARIANT_HOVER: Record<ButtonVariant, React.CSSProperties> = {
  primary:   { background: "var(--ap-primary-hover)" },
  dark:      { background: "#1F2937" },
  ghost:     { background: "#F3F4F6" },
  secondary: { background: "#E5EDF5" },
  whatsapp:  { background: "#1FB859" },
  success:   { background: "#15803D" },
  danger:    { background: "#B91C1C" },
};

export default function Button({
  variant = "primary",
  size = "md",
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);

  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    fontFamily: "var(--font-sans)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    transition: "background 0.15s, transform 0.1s",
    transform: hovered && !disabled ? "translateY(-1px)" : "none",
    whiteSpace: "nowrap",
    textDecoration: "none",
    ...SIZE_STYLES[size],
    ...VARIANT_BASE[variant],
    ...(hovered && !disabled ? VARIANT_HOVER[variant] : {}),
    ...style,
  };

  return (
    <button
      type={props.type ?? "button"}
      disabled={disabled}
      style={base}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...props}
    >
      {children}
    </button>
  );
}
