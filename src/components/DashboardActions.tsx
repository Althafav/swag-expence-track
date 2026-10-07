"use client";

import React from "react";
import { Download } from "lucide-react";
import Button from "./ui/Button";
import { useTrackerModals } from "./AppShell";

export default function DashboardActions() {
  const { openLogTransaction, openNewProject } = useTrackerModals();

  return (
    <div style={{ display: "flex", gap: "var(--sp-3)", flexWrap: "wrap" }}>
      <Button variant="primary" size="lg" iconLeft="receipt" style={{ flex: "1 1 220px" }} onClick={() => openLogTransaction()}>
        Log transaction
      </Button>
      <Button variant="outline" size="lg" iconLeft="folder-plus" onClick={openNewProject}>
        New project
      </Button>
      {/* Plain <a>, not Link: it's a file download from an API route, not a page. */}
      <a href="/api/export" download className="swag-btn swag-btn--outline swag-btn--lg">
        <Download size={16} />
        Export CSV
      </a>
    </div>
  );
}
