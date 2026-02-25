"use client";

import { Delete } from "lucide-react";

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
  { digit: "0" },
  { digit: "#" },
];

export function PhoneKeypad({ onDigit, onBackspace }: PhoneKeypadProps) {
  return (
    <div className="keypad-container">
      <div className="grid grid-cols-3 gap-3">
        {ROWS.map(({ digit, letters }) => (
          <button
            key={digit}
            type="button"
            onClick={() => onDigit(digit)}
            className="keypad-btn"
          >
            {digit}
            {letters && (
              <span className="mt-0.5 text-[9px] uppercase tracking-widest text-slate-400">
                {letters}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="effacer-wrap mt-4 flex justify-center">
        <button
          type="button"
          onClick={onBackspace}
          className="effacer-btn inline-flex items-center gap-1.5 transition-colors hover:text-slate-600"
          aria-label="Effacer"
        >
          <Delete className="h-5 w-5" />
          <span className="text-sm font-medium">Effacer</span>
        </button>
      </div>
    </div>
  );
}
