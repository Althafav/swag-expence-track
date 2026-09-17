"use client";

import React from "react";
import Modal from "./Modal";
import Button from "./Button";

export interface ActionSheetProps {
  open: boolean;
  onClose: () => void;
  onLogTransaction: () => void;
  onNewProject: () => void;
}

/**
 * The FAB's menu: "Log transaction" is the everyday job-site action and
 * always comes first; "New project" is setup and comes second. Every
 * entry point into logging a transaction (FAB, dashboard primary button)
 * opens this same sheet — never a second, divergent path.
 */
export default function ActionSheet({ open, onClose, onLogTransaction, onNewProject }: ActionSheetProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add"
      subtitle="What are you recording?"
      footer={
        <Button variant="ghost" block onClick={onClose}>
          Cancel
        </Button>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
        <Button
          variant="primary"
          block
          size="lg"
          iconLeft="receipt"
          onClick={() => {
            onClose();
            onLogTransaction();
          }}
        >
          Log transaction
        </Button>
        <Button
          variant="outline"
          block
          size="lg"
          iconLeft="folder-plus"
          onClick={() => {
            onClose();
            onNewProject();
          }}
        >
          New project
        </Button>
        <span style={{ font: "var(--type-body-sm)", color: "var(--text-muted)", textAlign: "center", marginTop: 4 }}>
          Logging a payment or expense is the everyday action — creating a project is setup.
        </span>
      </div>
    </Modal>
  );
}
