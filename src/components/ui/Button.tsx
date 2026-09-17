"use client";

import React from "react";
import Link from "next/link";
import {
  Receipt,
  FolderPlus,
  Plus,
  Download,
  Pencil,
  Trash2,
  ArrowLeft,
  ArrowRight,
  LogOut,
} from "lucide-react";

export type ButtonVariant = "primary" | "dark" | "outline" | "ghost" | "danger";
export type ButtonSize = "lg" | "md" | "sm";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to container width (used for sheet CTAs). */
  block?: boolean;
  iconLeft?: string | React.ReactNode;
  iconRight?: string | React.ReactNode;
  /** Renders a Next.js Link instead of a <button>. */
  href?: string;
  className?: string;
}

function renderIcon(icon: string | React.ReactNode | undefined, size: number) {
  if (!icon) return null;
  if (typeof icon !== "string") return icon;
  switch (icon) {
    case "receipt":
      return <Receipt size={size} />;
    case "folder-plus":
      return <FolderPlus size={size} />;
    case "plus":
      return <Plus size={size} />;
    case "download":
      return <Download size={size} />;
    case "pencil":
      return <Pencil size={size} />;
    case "delete":
    case "trash":
      return <Trash2 size={size} />;
    case "arrow-left":
      return <ArrowLeft size={size} />;
    case "arrow-right":
      return <ArrowRight size={size} />;
    case "log-out":
      return <LogOut size={size} />;
    default:
      return null;
  }
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  block = false,
  iconLeft,
  iconRight,
  disabled = false,
  href,
  onClick,
  type = "button",
  style,
  className = "",
  ...rest
}: ButtonProps) {
  const cls = [
    "swag-btn",
    `swag-btn--${variant}`,
    `swag-btn--${size}`,
    block ? "swag-btn--block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const iconPx = size === "sm" ? 14 : 16;

  const content = (
    <>
      {renderIcon(iconLeft, iconPx)}
      {children}
      {renderIcon(iconRight, iconPx)}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={cls} style={style}>
        {content}
      </Link>
    );
  }

  return (
    <button className={cls} type={type} disabled={disabled} onClick={onClick} style={style} {...rest}>
      {content}
    </button>
  );
}
