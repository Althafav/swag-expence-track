"use client";

import React from "react";
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
    </div>
  );
}
