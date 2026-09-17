import React from "react";

export interface FieldProps {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

/** Label + control wrapper matching `.swag-field` — not a design-system primitive, just shared form markup. */
export default function Field({ label, htmlFor, children, style }: FieldProps) {
  return (
    <div className="swag-field" style={style}>
      <label className="swag-field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}
