import React from "react";

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info" | "dark" | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  /** success = done/on-time; warning = due today; danger = overdue; info = scheduled; brand = highlight; dark = on acid surfaces. */
  tone?: BadgeTone;
  /** Prefix a filled dot in the current colour. */
  dot?: boolean;
  className?: string;
}

export default function Badge({ children, tone = "neutral", dot = false, className = "", style, ...rest }: BadgeProps) {
  const cls = ["swag-badge", `swag-badge--${tone}`, dot ? "swag-badge--dot" : "", className].filter(Boolean).join(" ");
  return (
    <span className={cls} style={style} {...rest}>
      {children}
    </span>
  );
}
