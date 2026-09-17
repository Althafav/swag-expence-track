import React from "react";
import { ArrowDownLeft, ArrowUpRight, Percent, TrendingUp, HelpCircle } from "lucide-react";
import Money, { MoneyKind } from "./Money";

export interface StatCardProps {
  label: string;
  value: number;
  /** income adds a moss left edge, expense a clay one, profit is sign-aware. */
  kind?: MoneyKind;
  /** Supporting line, e.g. "14 transactions". */
  caption?: React.ReactNode;
  /** Lucide icon name shown before the label. */
  icon?: "arrow-down-left" | "arrow-up-right" | "percent" | "trending-up" | React.ReactNode;
  /** Makes the tile a button (e.g. filter the transaction list by type). */
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

function renderIcon(icon: StatCardProps["icon"]) {
  if (!icon) return null;
  if (typeof icon !== "string") return icon;
  switch (icon) {
    case "arrow-down-left":
      return <ArrowDownLeft size={14} />;
    case "arrow-up-right":
      return <ArrowUpRight size={14} />;
    case "percent":
      return <Percent size={14} />;
    case "trending-up":
      return <TrendingUp size={14} />;
    default:
      return <HelpCircle size={14} />;
  }
}

/** Dashboard / project-detail metric tile: caps label, Anton figure, optional caption. */
export default function StatCard({
  label,
  value,
  kind = "neutral",
  caption,
  icon,
  onClick,
  style,
  className = "",
}: StatCardProps) {
  const cls = [
    "swag-stat",
    kind === "income" ? "swag-stat--income" : kind === "expense" ? "swag-stat--expense" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const Tag = (onClick ? "button" : "div") as React.ElementType;

  return (
    <Tag
      className={cls}
      {...(onClick ? { type: "button" as const } : {})}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : undefined, ...style }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          font: "var(--type-eyebrow)",
          letterSpacing: "var(--ls-caps-wide)",
          textTransform: "uppercase",
          color: "var(--text-muted)",
        }}
      >
        {renderIcon(icon)}
        {label}
      </span>
      <Money value={value} kind={kind} size="md" />
      {caption && (
        <span style={{ font: "var(--type-body-sm)", color: "var(--text-muted)" }}>{caption}</span>
      )}
    </Tag>
  );
}
