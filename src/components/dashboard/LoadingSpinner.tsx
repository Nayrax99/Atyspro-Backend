interface LoadingSpinnerProps {
  text?: string;
  /** Wrap in a full card padding — use false when already inside a card */
  padded?: boolean;
}

export default function LoadingSpinner({
  text = "Chargement…",
  padded = true,
}: LoadingSpinnerProps) {
  return (
    <div className={padded ? "loading-spinner" : "loading-spinner loading-spinner--inline"}>
      <div className="loading-spinner-icon" />
      <span className="loading-spinner-text">{text}</span>
    </div>
  );
}
