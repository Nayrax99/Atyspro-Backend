"use client";

interface PhoneKeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
}

const ROWS: { digit: string; letters?: string }[] = [
  { digit: "1", letters: "ABC" },
  { digit: "2", letters: "DEF" },
  { digit: "3", letters: "GHI" },
  { digit: "4", letters: "JKL" },
  { digit: "5", letters: "MNO" },
  { digit: "6", letters: "PQRS" },
  { digit: "7", letters: "TUV" },
  { digit: "8", letters: "WXYZ" },
  { digit: "9" },
  { digit: "*" },
  { digit: "0", letters: "+" },
  { digit: "#" },
];

export function PhoneKeypad({ onDigit }: PhoneKeypadProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {ROWS.map(({ digit, letters }) => (
        <button
          key={digit}
          type="button"
          onClick={() => onDigit(digit)}
          className="flex aspect-square flex-col items-center justify-center rounded-full bg-white text-[28px] font-light text-[#1c1c1e] active:opacity-70"
          style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}
        >
          {digit}
          {letters && (
            <span className="mt-0.5 text-[10px] font-normal uppercase tracking-[0.2em] text-[#8e8e93]">
              {letters}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
