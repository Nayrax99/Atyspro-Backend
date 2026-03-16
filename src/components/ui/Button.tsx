import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
}

export default function Button({
  variant = "primary",
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-[10px] text-sm font-medium " +
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
    "focus-visible:ring-sky-500 focus-visible:ring-offset-slate-50 disabled:opacity-60 disabled:cursor-not-allowed";

  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-[#2563EB] text-white hover:bg-[#1D4ED8] px-4 py-2",
    secondary:
      "bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] hover:bg-[#E5EDF5] px-4 py-2",
    ghost:
      "bg-transparent text-[#2563EB] hover:bg-[#EFF6FF] px-2 py-1",
    danger:
      "bg-[#EF4444] text-white hover:bg-[#DC2626] px-4 py-2",
  };

  const classes = [base, variants[variant], className].filter(Boolean).join(" ");

  return (
    <button
      type={props.type ?? "button"}
      className={classes}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

