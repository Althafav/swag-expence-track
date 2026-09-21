import React from "react";
import { FolderOpen, SearchX, Receipt, Trash2, AlertCircle } from "lucide-react";

export interface EmptyStateProps {
  icon?: "folder-open" | "search-x" | "receipt" | "trash" | React.ReactNode;
  title: string;
  /** One sentence saying what to do next. */
  body?: string;
  /** A single Button. */
  action?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

function renderIcon(icon: EmptyStateProps["icon"]) {
  if (!icon) return <FolderOpen size={24} />;
  if (typeof icon !== "string") return icon;
  switch (icon) {
    case "search-x":
      return <SearchX size={24} />;
    case "receipt":
      return <Receipt size={24} />;
    case "folder-open":
      return <FolderOpen size={24} />;
    case "trash":
      return <Trash2 size={24} />;
    default:
      return <AlertCircle size={24} />;
  }
}

/** Empty list / no-results state with one optional action. */
export default function EmptyState({ icon = "folder-open", title, body, action, style, className = "" }: EmptyStateProps) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--sp-4)",
        padding: "var(--sp-9) var(--sp-6)",
        textAlign: "center",
        ...style,
      }}
    >
      <span
        style={{
          width: 52,
          height: 52,
          borderRadius: "var(--r-card-inner)",
          background: "var(--surface-sunken)",
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {renderIcon(icon)}
      </span>
      <span style={{ font: "var(--type-title)", color: "var(--text-strong)" }}>{title}</span>
      {body && <p style={{ font: "var(--type-body-sm)", color: "var(--text-muted)", maxWidth: 300 }}>{body}</p>}
      {action}
    </div>
  );
}
