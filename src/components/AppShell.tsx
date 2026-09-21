"use client";

import React, { createContext, useContext, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FolderOpen } from "lucide-react";
import Button from "./ui/Button";
import IconButton from "./ui/IconButton";
import ActionSheet from "./ui/ActionSheet";
import TransactionFormModal from "./TransactionFormModal";
import ProjectFormModal from "./ProjectFormModal";
import type { Project, Transaction } from "@/lib/db";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderOpen },
];

type ProjectRef = { id: string; name: string };

type SheetState =
  | null
  | { kind: "actionsheet" }
  | { kind: "tx"; project?: ProjectRef; tx?: Transaction }
  | { kind: "project"; project?: Project };

interface TrackerModalsContextValue {
  openActionSheet: () => void;
  openLogTransaction: (project?: ProjectRef) => void;
  openEditTransaction: (tx: Transaction, project: ProjectRef) => void;
  openNewProject: () => void;
  openEditProject: (project: Project) => void;
}

const TrackerModalsContext = createContext<TrackerModalsContextValue | null>(null);

/** Every "add" entry point (FAB, dashboard buttons, project detail) shares this — one code path per Ground rule 4. */
export function useTrackerModals(): TrackerModalsContextValue {
  const ctx = useContext(TrackerModalsContext);
  if (!ctx) throw new Error("useTrackerModals must be used within AppShell");
  return ctx;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sheet, setSheet] = useState<SheetState>(null);

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  async function signOut() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const modals: TrackerModalsContextValue = {
    openActionSheet: () => setSheet({ kind: "actionsheet" }),
    openLogTransaction: (project) => setSheet({ kind: "tx", project }),
    openEditTransaction: (tx, project) => setSheet({ kind: "tx", project, tx }),
    openNewProject: () => setSheet({ kind: "project" }),
    openEditProject: (project) => setSheet({ kind: "project", project }),
  };

  function closeSheet() {
    setSheet(null);
  }

  return (
    <TrackerModalsContext.Provider value={modals}>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--surface-page)" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--sp-5)",
            padding: "var(--sp-4) var(--gutter-app)",
            background: "var(--surface)",
            borderBottom: "1px solid var(--line)",
            flex: "none",
          }}
        >
          <Link href="/"  style={{ display: "flex", alignItems: "center" }}>
            <Image className="bg-white" src="/swag-logo.png" alt="SWAG Landscapes" width={85} height={44} style={{ height: 44, width: "auto" }} priority />
          </Link>

          <nav className="hidden md:flex" style={{ gap: "var(--sp-2)", flex: 1 }}>
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  minHeight: 40,
                  padding: "0 var(--sp-5)",
                  borderRadius: "var(--r-pill)",
                  textDecoration: "none",
                  background: isActive(href) ? "var(--ink)" : "transparent",
                  color: isActive(href) ? "var(--lime-400)" : "var(--text-muted)",
                  font: "var(--type-label)",
                }}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </nav>
          <span className="md:hidden" style={{ flex: 1 }} />

          <span className="hidden md:inline-flex" style={{ gap: "var(--sp-3)" }}>
            <Button variant="primary" size="md" iconLeft="receipt" onClick={() => modals.openLogTransaction()}>
              Log transaction
            </Button>
            <Button variant="ghost" size="md" iconLeft="log-out" onClick={signOut}>
              Sign out
            </Button>
          </span>
          <span className="md:hidden">
            <IconButton icon="log-out" label="Sign out" variant="plain" onClick={signOut} />
          </span>
        </header>

        <main className="swag-shell-main">
          <div style={{ maxWidth: "var(--container-max)", margin: "0 auto" }}>{children}</div>
        </main>

        <div className="md:hidden" style={{ position: "fixed", bottom: 78, right: 16, zIndex: 40 }}>
          <IconButton icon="plus" label="Add transaction or project" variant="fab" size="lg" onClick={modals.openActionSheet} />
        </div>

        <div className="md:hidden" style={{ position: "fixed", bottom: 0, left: 0, right: 0 }}>
          <nav className="swag-nav">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={"swag-nav__item" + (isActive(href) ? " swag-nav__item--active" : "")}>
                <Icon size={22} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <ActionSheet
        open={sheet?.kind === "actionsheet"}
        onClose={closeSheet}
        onLogTransaction={() => modals.openLogTransaction()}
        onNewProject={modals.openNewProject}
      />
      <TransactionFormModal
        open={sheet?.kind === "tx"}
        onClose={closeSheet}
        project={sheet?.kind === "tx" ? sheet.project : undefined}
        tx={sheet?.kind === "tx" ? sheet.tx : undefined}
      />
      <ProjectFormModal
        open={sheet?.kind === "project"}
        onClose={closeSheet}
        project={sheet?.kind === "project" ? sheet.project : undefined}
      />
    </TrackerModalsContext.Provider>
  );
}
