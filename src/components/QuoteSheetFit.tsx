"use client";

import React, { useEffect, useRef, useState } from "react";

/** `.qdoc` is 595.3pt (A4) wide; 96px per 72pt. A constant, so the zoom never feeds back into its own measurement. */
const SHEET_PX = (595.3 * 96) / 72;

/**
 * Shrinks the fixed-width A4 sheet to fit narrow screens (phones) so the
 * preview keeps the printed layout instead of reflowing. Print resets the
 * zoom (see `.qdoc-fit` in globals.css).
 */
export default function QuoteSheetFit({ children }: { children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const fit = () => {
      const available = outer.current?.clientWidth ?? 0;
      if (available) setZoom(Math.min(1, available / SHEET_PX));
    };
    fit();
    const observer = new ResizeObserver(fit);
    if (outer.current) observer.observe(outer.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={outer} className="qdoc-fit">
      <div style={{ zoom }}>
        {children}
      </div>
    </div>
  );
}
