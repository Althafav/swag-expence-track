"use client";

import React from "react";
import { Printer } from "lucide-react";
import Button from "./ui/Button";

/** Screen-only bar above the printed quote; hidden by `@media print`. */
export default function PrintToolbar({ backHref }: { backHref: string }) {
  return (
    <div className="qdoc-toolbar">
      <Button variant="ghost" iconLeft="arrow-left" href={backHref}>
        Back to quote
      </Button>
      <span className="qdoc-toolbar__hint">In the print window, pick “Save as PDF” to get the file, or a printer to print it.</span>
      <Button variant="primary" iconLeft={<Printer size={16} />} onClick={() => window.print()}>
        Download PDF
      </Button>
    </div>
  );
}
