"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, FolderOpen, Undo2 } from "lucide-react";
import Button from "./ui/Button";
import Card from "./ui/Card";
import EmptyState from "./ui/EmptyState";
import Modal from "./ui/Modal";
import Money from "./ui/Money";
import SectionHead from "./ui/SectionHead";
import { RETENTION_DAYS, daysLeft, daysSince } from "@/lib/bin";
import { formatDate, plural } from "@/lib/format";
import type { BinProject, BinTransaction } from "@/lib/queries";

export interface RecycleBinClientProps {
  projects: BinProject[];
  transactions: BinTransaction[];
}

type Confirm = { kind: "projects" | "transactions"; id: string; label: string } | { kind: "all" } | null;

function deletedLine(deletedAt: string): string {
  const ago = daysSince(deletedAt);
  const left = daysLeft(deletedAt);
  return `Deleted ${ago === 0 ? "today" : plural(ago, "day", "days") + " ago"} · ${plural(left, "day", "days")} left`;
}

interface BinRowProps {
  tile: React.ReactNode;
  title: string;
  meta: string;
  note: string;
  amount?: React.ReactNode;
  actions: React.ReactNode;
}

/** One bin entry: tile, text, optional amount, and its Restore / Delete forever actions. */
function BinRow({ tile, title, meta, note, amount, actions }: BinRowProps) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "var(--sp-4)",
        padding: "var(--sp-4) 0",
        borderBottom: "1px solid var(--border-hairline)",
      }}
    >
      <div style={{ flex: "1 1 240px", minWidth: 0, display: "flex", alignItems: "center", gap: "var(--sp-4)" }}>
        {tile}
        <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ font: "var(--type-label)", color: "var(--text-strong)", overflowWrap: "anywhere" }}>{title}</span>
          <span style={{ font: "var(--type-body-sm)", color: "var(--text-muted)", overflowWrap: "anywhere" }}>{meta}</span>
          <span style={{ font: "var(--type-body-sm)", color: "var(--text-muted)" }}>{note}</span>
        </span>
        {amount}
      </div>
      <div style={{ display: "flex", gap: "var(--sp-3)", flexWrap: "wrap" }}>{actions}</div>
    </div>
  );
}

export default function RecycleBinClient({ projects, transactions }: RecycleBinClientProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<Confirm>(null);

  const total = projects.length + transactions.length;

  async function run(key: string, request: () => Promise<Response>, failure: string) {
    setError("");
    setBusy(key);
    try {
      const res = await request();
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ? `${failure} ${body.error}.` : failure);
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError(failure);
      return false;
    } finally {
      setBusy(null);
    }
  }

  function restore(kind: "projects" | "transactions", id: string) {
    return run(`restore:${id}`, () => fetch(`/api/bin/${kind}/${id}`, { method: "POST" }), "Could not restore. Try again.");
  }

  async function deleteForever() {
    if (!confirm) return;
    const target = confirm;
    const ok =
      target.kind === "all"
        ? await run("all", () => fetch("/api/bin", { method: "DELETE" }), "Could not empty the bin. Try again.")
        : await run(
            `purge:${target.id}`,
            () => fetch(`/api/bin/${target.kind}/${target.id}`, { method: "DELETE" }),
            "Could not delete. Try again."
          );
    if (ok) setConfirm(null);
  }

  const confirmCopy =
    confirm?.kind === "all"
      ? { title: "Empty recycle bin", body: `Permanently delete all ${plural(total, "item", "items")}? This can't be undone.`, action: "Empty bin" }
      : confirm
        ? { title: "Delete forever", body: `Permanently delete ${confirm.label}? This can't be undone.`, action: "Delete forever" }
        : null;

  const confirming = confirm !== null && busy !== null && (busy === "all" || busy.startsWith("purge:"));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-4)", alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 240px", minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          <h2 style={{ font: "var(--type-h2)", letterSpacing: "var(--ls-display)", textTransform: "uppercase" }}>Recycle bin</h2>
          <span style={{ font: "var(--type-body-sm)", color: "var(--text-muted)" }}>
            Deleted projects and transactions are kept for {RETENTION_DAYS} days, then removed for good.
          </span>
        </div>
        {total > 0 && (
          <Button variant="outline" iconLeft="trash" onClick={() => setConfirm({ kind: "all" })} disabled={busy !== null}>
            Empty bin
          </Button>
        )}
      </div>

      {error && <span style={{ font: "var(--type-body-sm)", color: "var(--expense)" }}>{error}</span>}

      {total === 0 ? (
        <Card>
          <EmptyState
            icon="trash"
            title="Recycle bin is empty"
            body={`Deleted projects and transactions show up here for ${RETENTION_DAYS} days.`}
          />
        </Card>
      ) : (
        <>
          {projects.length > 0 && (
            <Card padding={0}>
              <div style={{ padding: "var(--sp-5) var(--sp-5) 0" }}>
                <SectionHead title={`Projects (${projects.length})`} />
              </div>
              <div style={{ padding: "0 var(--sp-5)" }}>
                {projects.map((p) => (
                  <BinRow
                    key={p.id}
                    tile={<Tile tone="neutral">{<FolderOpen size={18} />}</Tile>}
                    title={p.name}
                    meta={`${p.location} · ${plural(p.transactionCount, "transaction", "transactions")} inside`}
                    note={deletedLine(p.deletedAt)}
                    actions={
                      <>
                        <Button
                          variant="primary"
                          iconLeft={<Undo2 size={16} />}
                          onClick={() => restore("projects", p.id)}
                          disabled={busy !== null}
                        >
                          {busy === `restore:${p.id}` ? "Restoring…" : "Restore"}
                        </Button>
                        <Button
                          variant="ghost"
                          iconLeft="trash"
                          style={{ color: "var(--expense)" }}
                          onClick={() => setConfirm({ kind: "projects", id: p.id, label: `“${p.name}” and its transactions` })}
                          disabled={busy !== null}
                        >
                          Delete forever
                        </Button>
                      </>
                    }
                  />
                ))}
              </div>
            </Card>
          )}

          {transactions.length > 0 && (
            <Card padding={0}>
              <div style={{ padding: "var(--sp-5) var(--sp-5) 0" }}>
                <SectionHead title={`Transactions (${transactions.length})`} />
              </div>
              <div style={{ padding: "0 var(--sp-5)" }}>
                {transactions.map((t) => {
                  const income = t.type === "income";
                  return (
                    <BinRow
                      key={t.id}
                      tile={<Tile tone={income ? "income" : "expense"}>{income ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}</Tile>}
                      title={t.category}
                      meta={`${formatDate(t.date)} · ${t.projectName}${t.notes ? ` · ${t.notes}` : ""}`}
                      note={deletedLine(t.deletedAt)}
                      amount={<Money value={t.amount} kind={income ? "income" : "expense"} size="sm" signed />}
                      actions={
                        <>
                          <Button
                            variant="primary"
                            iconLeft={<Undo2 size={16} />}
                            onClick={() => restore("transactions", t.id)}
                            disabled={busy !== null}
                          >
                            {busy === `restore:${t.id}` ? "Restoring…" : "Restore"}
                          </Button>
                          <Button
                            variant="ghost"
                            iconLeft="trash"
                            style={{ color: "var(--expense)" }}
                            onClick={() => setConfirm({ kind: "transactions", id: t.id, label: `this ${t.category.toLowerCase()} entry` })}
                            disabled={busy !== null}
                          >
                            Delete forever
                          </Button>
                        </>
                      }
                    />
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}

      <Modal
        open={confirm !== null}
        onClose={() => !confirming && setConfirm(null)}
        title={confirmCopy?.title ?? "Delete forever"}
        footer={
          <>
            <span style={{ flex: 1 }} />
            <Button variant="ghost" onClick={() => setConfirm(null)} disabled={confirming}>
              Cancel
            </Button>
            <Button variant="danger" onClick={deleteForever} disabled={confirming}>
              {confirming ? "Deleting…" : (confirmCopy?.action ?? "Delete forever")}
            </Button>
          </>
        }
      >
        <p style={{ font: "var(--type-body)" }}>{confirmCopy?.body}</p>
      </Modal>
    </div>
  );
}

function Tile({ tone, children }: { tone: "neutral" | "income" | "expense"; children: React.ReactNode }) {
  const colors = {
    neutral: { background: "var(--surface-sunken)", color: "var(--text-muted)" },
    income: { background: "var(--income-soft)", color: "var(--income)" },
    expense: { background: "var(--expense-soft)", color: "var(--expense)" },
  }[tone];
  return (
    <span
      style={{
        width: 38,
        height: 38,
        flex: "none",
        borderRadius: "var(--r-control)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...colors,
      }}
    >
      {children}
    </span>
  );
}
