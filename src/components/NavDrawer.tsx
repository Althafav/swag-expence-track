"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, LogOut, type LucideIcon } from "lucide-react";

export interface DrawerLink {
  href: string;
  label: string;
  /** One plain line saying what's there, so rarely-visited pages are findable. */
  hint: string;
  icon: LucideIcon;
}

interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
  links: DrawerLink[];
  isActive: (href: string) => boolean;
  onSignOut: () => void;
}

/**
 * Left-hand drawer for the less-used destinations, opened from the header
 * logo. Dark ink panel with the mow-lines motif (the design system keeps
 * that motif for dark surfaces). Escape / scrim / × close it, Tab stays
 * inside while open, and focus returns to the logo button on close.
 */
export default function NavDrawer({ open, onClose, links, isActive, onSignOut }: NavDrawerProps) {
  const panel = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const focusables = panel.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>(".swag-drawer__link--active, .swag-drawer__link")?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      trigger?.focus();
    };
  }, [open]);

  return (
    <div className={"swag-drawer" + (open ? " swag-drawer--open" : "")} aria-hidden={!open} inert={!open}>
      <div className="swag-drawer__scrim" onClick={onClose} />
      <div
        ref={panel}
        className="swag-drawer__panel mow-lines mow-lines--wide"
        role="dialog"
        aria-modal="true"
        aria-label="More pages"
      >
        <div className="swag-drawer__head">
          <Image
            src="/swag-logo-on-dark.png"
            alt="SWAG Landscapes"
            width={1640}
            height={634}
            style={{ height: 40, width: "auto" }}
          />
          <button type="button" className="swag-drawer__close" onClick={onClose} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>

        <nav className="swag-drawer__nav">
          {links.map(({ href, label, hint, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              aria-current={isActive(href) ? "page" : undefined}
              className={"swag-drawer__link" + (isActive(href) ? " swag-drawer__link--active" : "")}
            >
              <Icon size={22} className="swag-drawer__icon" />
              <span className="swag-drawer__text">
                <span className="swag-drawer__label">{label}</span>
                <span className="swag-drawer__hint">{hint}</span>
              </span>
            </Link>
          ))}
        </nav>

        <button type="button" className="swag-drawer__signout" onClick={onSignOut}>
          <LogOut size={20} />
          Sign out
        </button>
      </div>
    </div>
  );
}
