"use client";

import React from "react";

export type CardVariant = "default" | "flat" | "raised" | "inverse" | "brand";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: number | string;
  as?: React.ElementType;
  onClick?: () => void;
}

export default function Card({
  children,
  variant = "default",
  padding = 20,
  as: Component = "div",
  onClick,
  style,
  className = "",
  ...rest
}: CardProps) {
  const Tag = onClick ? "button" : Component;
  const cls = [
    "swag-card",
    variant !== "default" ? `swag-card--${variant}` : "",
    onClick ? "swag-card--tappable" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      className={cls}
      onClick={onClick}
      style={{ padding, textAlign: "left", font: "inherit", width: "100%", display: "block", ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
