"use client";

import React from "react";
import { ChevronRight } from "lucide-react";

export interface SectionHeadProps {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  /** Escape hatch for an arbitrary action element instead of the actionLabel button. */
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

export default function SectionHead({ title, eyebrow, actionLabel, onAction, action, style }: SectionHeadProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--sp-4)", ...style }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        {eyebrow && <span className="swag-eyebrow">{eyebrow}</span>}
        <span style={{ font: "var(--type-title)", color: "var(--text-strong)" }}>{title}</span>
      </div>
      {action}
      {!action && actionLabel && (
        <button
          type="button"
          onClick={onAction}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            border: 0,
            background: "transparent",
            font: "var(--type-label)",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: "6px 0",
          }}
        >
          {actionLabel}
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}
