import type { CSSProperties } from "react";

type ScoreSize = "sm" | "md" | "lg";

const SIZES: Record<ScoreSize, { size: number; radius: number; strokeWidth: number }> = {
  sm: { size: 28, radius: 11, strokeWidth: 2.5 },
  md: { size: 36, radius: 15, strokeWidth: 3 },
  lg: { size: 48, radius: 20, strokeWidth: 4 },
};

function getScoreColor(score: number): string {
  if (score >= 70) return "#DC2626";
  if (score >= 40) return "var(--ap-primary)";
  if (score >= 20) return "#D97706";
  return "#D1D5DB";
}

interface ScoreCircleProps {
  score: number | null;
  size?: ScoreSize;
  style?: CSSProperties;
}

export default function ScoreCircle({ score, size = "md", style }: ScoreCircleProps) {
  const { size: dim, radius, strokeWidth } = SIZES[size];
  const circumference = 2 * Math.PI * radius;
  const s = score ?? 0;
  const offset = circumference * (1 - s / 100);
  const color = getScoreColor(s);
  const fontSize = size === "lg" ? 13 : size === "md" ? 11 : 9;

  return (
    <div
      style={{
        position: "relative",
        width: dim,
        height: dim,
        flexShrink: 0,
        ...style,
      }}
    >
      <svg
        width={dim}
        height={dim}
        style={{ transform: "rotate(-90deg)", display: "block" }}
      >
        {/* Track */}
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>
      {/* Label */}
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize,
          fontWeight: 700,
          color,
          fontFamily: "var(--font-sans)",
          letterSpacing: "-0.02em",
        }}
      >
        {score != null ? score : "—"}
      </span>
    </div>
  );
}
