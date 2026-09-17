"use client";

import React from "react";
import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";
import Badge from "./Badge";
import Money from "./Money";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/status";

export interface ProjectSummary {
  id: string;
  name: string;
  location: string;
  client?: string | null;
  status: "ongoing" | "completed" | "on_hold";
  /** Total income booked against the project. */
  income: number;
  /** Total expense booked against the project. */
  expense: number;
}

export interface ProjectRowProps {
  project: ProjectSummary;
  onClick?: () => void;
  /** The 5px profit-sign colour bar. Keep it on — it is existing product identity. */
  showBar?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * A project in any list, with the sign-aware profit bar, direction glyph,
 * and the word "Profit"/"Loss" — three redundant cues that survive both
 * sunlight and colour-blindness. Profit is always computed here from
 * income − expense so a list can never disagree with a detail screen.
 */
export default function ProjectRow({ project, onClick, showBar = true, style, className = "" }: ProjectRowProps) {
  const profit = (project.income || 0) - (project.expense || 0);
  const down = profit < 0;

  const content = (
    <>
      {showBar && (
        <span
          className="swag-prow__bar"
          style={{ background: down ? "var(--profit-negative)" : "var(--profit-positive)" }}
        />
      )}
      <span
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-4)",
          padding: "var(--sp-4) var(--sp-5)",
        }}
      >
        <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", minWidth: 0 }}>
            <span
              style={{
                font: "var(--type-title)",
                color: "var(--text-strong)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {project.name}
            </span>
            <Badge tone={STATUS_TONE[project.status] ?? "brand"}>{STATUS_LABEL[project.status] ?? project.status}</Badge>
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              font: "var(--type-body-sm)",
              color: "var(--text-muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <MapPin size={13} className="shrink-0" />
            <span className="truncate">{project.location}</span>
            {project.client && <span className="truncate">· {project.client}</span>}
          </span>
        </span>

        <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
          <Money value={profit} kind="profit" size="sm" showGlyph />
          <span style={{ font: "var(--type-body-sm)", color: "var(--text-faint)" }}>{down ? "Loss" : "Profit"}</span>
        </span>

        <ChevronRight size={16} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
      </span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={`swag-prow ${className}`} onClick={onClick} style={style}>
        {content}
      </button>
    );
  }

  return (
    <Link href={`/projects/${project.id}`} className={`swag-prow ${className}`} style={style}>
      {content}
    </Link>
  );
}
