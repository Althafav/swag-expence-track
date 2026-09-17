"use client";

import React from "react";
import { Delete } from "lucide-react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"] as const;

export interface KeypadProps {
  /** Receives "0"–"9", "." or "del". */
  onKey?: (key: string) => void;
  style?: React.CSSProperties;
}

/** 3×4 numeric keypad for amount entry sheets (1–9, ".", 0, delete). */
export default function Keypad({ onKey, style }: KeypadProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--sp-2)", ...style }}>
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          className="swag-key"
          onClick={() => onKey?.(k)}
          aria-label={k === "del" ? "Delete" : k}
        >
          {k === "del" ? <Delete size={24} /> : k}
        </button>
      ))}
    </div>
  );
}
