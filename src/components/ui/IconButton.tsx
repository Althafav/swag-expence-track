"use client";

import React from "react";
import { LogOut, Plus, ArrowLeft, ArrowRight, X, Pencil, Download, Trash2 } from "lucide-react";

export type IconButtonVariant = "plain" | "surface" | "brand" | "fab";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string | React.ReactNode;
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
}

function renderIcon(icon: string | React.ReactNode, size: number) {
  if (!icon) return null;
  if (typeof icon !== "string") return icon;
  switch (icon) {
    case "log-out":
      return <LogOut size={size} />;
    case "plus":
      return <Plus size={size} />;
    case "arrow-left":
      return <ArrowLeft size={size} />;
    case "arrow-right":
      return <ArrowRight size={size} />;
    case "x":
    case "close":
      return <X size={size} />;
    case "pencil":
      return <Pencil size={size} />;
    case "download":
      return <Download size={size} />;
    case "delete":
    case "trash":
      return <Trash2 size={size} />;
    default:
      return null;
  }
}

export default function IconButton({
  icon,
  label,
  variant = "plain",
  size = "md",
  disabled,
  onClick,
  style,
  className = "",
  type = "button",
  ...rest
}: IconButtonProps) {
  const px = size === "sm" ? 16 : size === "lg" ? 26 : 20;
  const cls = ["swag-iconbtn", `swag-iconbtn--${size}`, `swag-iconbtn--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={cls}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      type={type}
      style={style}
      {...rest}
    >
      {renderIcon(icon, px)}
    </button>
  );
}
