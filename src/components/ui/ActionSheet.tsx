"use client";

import React from "react";
import Modal from "./Modal";
import { Building2, FileText } from "lucide-react";
import Button from "./Button";

export interface ActionSheetProps {
  open: boolean;
  onClose: () => void;
  onLogTransaction: () => void;
  /** Log a company expense — salary, marketing, rent: money for no one project. */
  onCompanyExpense: () => void;
  onNewProject: () => void;
  onNewQuote: () => void;
}

/**
 * The FAB's menu: "Log transaction" is the everyday job-site action and
 * always comes first; "New project" is setup and comes second. Every
 * entry point into logging a transaction (FAB, dashboard primary button)
 * opens this same sheet — never a second, divergent path.
 */
export default function ActionSheet({ open, onClose, onLogTransaction, onCompanyExpense, onNewProject, onNewQuote }: ActionSheetProps) {
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
          iconLeft={<Building2 size={16} />}
          onClick={() => {
            onClose();
            onCompanyExpense();
          }}
        >
          Company expense
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
        <Button
          variant="outline"
          block
          size="lg"
          iconLeft={<FileText size={16} />}
          onClick={() => {
            onClose();
            onNewQuote();
          }}
        >
          New quote
        </Button>
        <span style={{ font: "var(--type-body-sm)", color: "var(--text-muted)", textAlign: "center", marginTop: 4 }}>
          Company expense is for costs that aren’t for one project — salaries, marketing, rent.
        </span>
      </div>
    </Modal>
  );
}
