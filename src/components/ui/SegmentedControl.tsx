"use client";

import React from "react";

export interface SegmentOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  options: (string | SegmentOption)[];
  value: string;
  onChange: (value: string) => void;
  onBrand?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export default function SegmentedControl({
  options = [],
  value,
  onChange,
  onBrand = false,
  style,
  className = "",
}: SegmentedControlProps) {
  return (
    <div className={`swag-seg ${onBrand ? "swag-seg--on-brand" : ""} ${className}`} style={style} role="tablist">
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const t = typeof o === "string" ? o : o.label;
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={active}
            className={`swag-seg__item ${active ? "swag-seg__item--active" : ""}`}
            onClick={() => onChange?.(v)}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}
