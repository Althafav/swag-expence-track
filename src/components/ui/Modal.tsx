"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  open: boolean;
  /** Uppercase Anton title — also the dialog's accessible name. */
  title: string;
  /** One line of context under the title. */
  subtitle?: string;
  /** Fired by the × button, the scrim, and Escape. */
  onClose?: () => void;
  children?: React.ReactNode;
  /** Action row; put the primary Button last. */
  footer?: React.ReactNode;
  /** Override the generated id linking title to `aria-labelledby`. */
  labelledBy?: string;
}

/**
 * Accessible sheet/dialog: real <button> controls, role="dialog",
 * aria-modal, Escape to close, Tab trapped inside the panel, first
 * field focused on open, and focus returned to whatever triggered it
 * on close. Bottom sheet on phones, centred dialog from 720px up.
 */
export default function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  labelledBy = "swag-modal-title",
}: ModalProps) {
  const panel = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLElement | null>(null);

  // Kept in a ref so the effect below only needs to depend on `open` —
  // depending on `onClose` directly would re-run the effect (and so
  // re-capture the trigger and restore focus prematurely) any time a
  // parent re-renders with a new inline onClose function.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    // Remember what had focus before the modal opened, so a keyboard or
    // screen-reader user never loses their place after dismissing it.
    trigger.current = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const els = panel.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey, true);

    // Scoped to the body content only — never the header, so this can't
    // land on the close button, which sits before `children` in DOM order.
    const t = setTimeout(() => {
      const el = body.current?.querySelector<HTMLElement>("input, select, textarea, button");
      el?.focus();
    }, 30);

    return () => {
      document.removeEventListener("keydown", onKey, true);
      clearTimeout(t);
      trigger.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="swag-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="swag-modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy} ref={panel}>
        <div className="swag-modal__head">
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
            <h3
              id={labelledBy}
              style={{ font: "var(--type-h3)", letterSpacing: "var(--ls-display)", textTransform: "uppercase" }}
            >
              {title}
            </h3>
            {subtitle && <span style={{ font: "var(--type-body-sm)", color: "var(--text-muted)" }}>{subtitle}</span>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 40,
              height: 40,
              flex: "none",
              borderRadius: "var(--r-pill)",
              border: 0,
              background: "var(--surface-sunken)",
              color: "var(--text-strong)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="swag-modal__body" ref={body}>
          {children}
        </div>

        {footer && <div className="swag-modal__foot">{footer}</div>}
      </div>
    </div>
  );
}
