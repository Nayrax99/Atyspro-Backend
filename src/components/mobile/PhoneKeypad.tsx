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
    <div className="grid grid-cols-3 justify-items-center gap-6">
      {ROWS.map(({ digit, letters }) => (
        <button
          key={digit}
          type="button"
          onClick={() => onDigit(digit)}
          className="flex h-[70px] w-[70px] flex-col items-center justify-center rounded-[22px] bg-white text-[20px] font-medium text-slate-800 shadow-[0_6px_18px_rgba(15,23,42,0.12)] transition-all duration-150 active:scale-95"
        >
          {digit}
          {letters && (
            <span className="mt-0.5 text-[10px] tracking-wide text-slate-400">
              {letters}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
