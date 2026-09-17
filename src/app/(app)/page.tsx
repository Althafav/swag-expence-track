import Link from "next/link";
import DashboardActions from "@/components/DashboardActions";
import Card from "@/components/ui/Card";
import SectionHead from "@/components/ui/SectionHead";
import Money from "@/components/ui/Money";
import StatCard from "@/components/ui/StatCard";
import ProjectRow from "@/components/ui/ProjectRow";
import TransactionRow from "@/components/ui/TransactionRow";
import TrendChart from "@/components/TrendChart";
import { getDashboardData, listRecentTransactions } from "@/lib/queries";
import { formatPercent } from "@/lib/format";

// This reads live financial data that changes via the API routes (create/edit/
// delete project or transaction) — it must never be statically cached, or
// visitors would see a frozen snapshot from build time.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { projects, totalIncome, totalExpense, totalProfit, monthly } = await getDashboardData();
  const recent = await listRecentTransactions(4);
  const ranked = [...projects].sort((a, b) => b.profit - a.profit);
  const ongoing = projects.filter((p) => p.status === "ongoing").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)" }}>
      <div
        className="mow-lines"
        style={{
          background: "var(--ink)",
          borderRadius: "var(--r-card)",
          padding: "var(--sp-6)",
          color: "var(--text-on-dark)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--sp-6)",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-6)", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span className="swag-eyebrow" style={{ color: "var(--text-on-dark-muted)" }}>
              Net profit · all projects
            </span>
            <Money value={totalProfit} kind="on-dark" size="hero" />
            <span style={{ font: "var(--type-body-sm)", color: "var(--text-on-dark-muted)" }}>
              {projects.length} projects · {ongoing} ongoing
            </span>
          </div>
          <div style={{ display: "flex", gap: "var(--sp-7)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span className="swag-eyebrow" style={{ color: "var(--text-on-dark-muted)" }}>
                Income
              </span>
              <Money value={totalIncome} kind="neutral" size="sm" style={{ color: "#C7E6C9" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span className="swag-eyebrow" style={{ color: "var(--text-on-dark-muted)" }}>
                Expense
              </span>
              <Money value={totalExpense} kind="neutral" size="sm" style={{ color: "#F0B8A6" }} />
            </div>
          </div>
        </div>
        <TrendChart data={monthly} onDark height={180} />
      </div>

      <DashboardActions />

      <div className="swag-stat-grid">
        <StatCard label="Income" value={totalIncome} kind="income" icon="arrow-down-left" caption="All time" />
        <StatCard label="Expense" value={totalExpense} kind="expense" icon="arrow-up-right" caption="All time" />
        <StatCard label="Margin" value={totalProfit} kind="profit" icon="percent" caption={`${formatPercent(totalProfit, totalIncome)} of income`} />
      </div>

      <Card padding={0}>
        <div style={{ padding: "var(--sp-5) var(--sp-5) 0" }}>
          <SectionHead
            title="Projects by profit"
            eyebrow="Ranked"
            action={
              <Link href="/projects" style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "var(--type-label)", color: "var(--text-muted)" }}>
                All projects
              </Link>
            }
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)", padding: "var(--sp-4) var(--sp-5) var(--sp-5)" }}>
          {ranked.slice(0, 4).map((p) => (
            <ProjectRow key={p.id} project={p} />
          ))}
        </div>
      </Card>

      <Card padding={0}>
        <div style={{ padding: "var(--sp-5) var(--sp-5) 0" }}>
          <SectionHead title="Recent activity" eyebrow="Across projects" />
        </div>
        <div style={{ padding: "var(--sp-2) var(--sp-5) var(--sp-4)" }}>
          {recent.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} showProject />
          ))}
        </div>
      </Card>
    </div>
  );
}
