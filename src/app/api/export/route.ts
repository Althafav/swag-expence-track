import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProject, listAllTransactions, listProjects, listTransactions } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/status";

function csvCell(value: string): string {
  // Neutralise spreadsheet formula injection (a note starting with "=" etc.).
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function slug(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
}

function csvResponse(csv: string, filename: string) {
  // The BOM makes Excel read the file as UTF-8 (categories contain "·").
  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(request: NextRequest) {
  // No projectId param at all = whole-business export (dashboard). An empty
  // ?projectId= is a broken project link, not a request for everything.
  const params = request.nextUrl.searchParams;
  if (!params.has("projectId")) return exportAll();
  const projectId = params.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  return exportProject(projectId);
}

async function exportProject(projectId: string) {
  const project = await getProject(projectId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const transactions = await listTransactions(projectId);
  const header = ["Date", "Type", "Category", "Amount", "Notes"];
  const rows = transactions.map((t) => [formatDate(t.date), t.type, t.category, String(t.amount), t.notes || ""]);

  return csvResponse(toCsv([header, ...rows]), `${slug(project.name)}-transactions.csv`);
}

// Whole-business export: one CSV with two sections — a per-project accounts
// summary (with a totals row), then every live transaction across live projects.
async function exportAll() {
  const [projects, transactions] = await Promise.all([listProjects(), listAllTransactions()]);
  const sorted = [...projects].sort((a, b) => a.name.localeCompare(b.name));

  const totalIncome = sorted.reduce((s, p) => s + p.income, 0);
  const totalExpense = sorted.reduce((s, p) => s + p.expense, 0);
  const margin = (profit: number, income: number) => (income > 0 ? `${Math.round((profit / income) * 100)}%` : "");

  const summary: string[][] = [
    ["PROJECT ACCOUNTS"],
    ["Project", "Client", "Location", "Status", "Start date", "Completed date", "Transactions", "Income", "Expense", "Profit", "Margin"],
    ...sorted.map((p) => [
      p.name,
      p.client || "",
      p.location,
      STATUS_LABEL[p.status] ?? p.status,
      p.startDate ? formatDate(p.startDate) : "",
      p.completedDate ? formatDate(p.completedDate) : "",
      String(transactions.filter((t) => t.projectId === p.id).length),
      String(p.income),
      String(p.expense),
      String(p.profit),
      margin(p.profit, p.income),
    ]),
    [
      "TOTAL",
      "",
      "",
      "",
      "",
      "",
      String(transactions.length),
      String(totalIncome),
      String(totalExpense),
      String(totalIncome - totalExpense),
      margin(totalIncome - totalExpense, totalIncome),
    ],
  ];

  const ledger: string[][] = [
    ["ALL TRANSACTIONS"],
    ["Date", "Project", "Type", "Category", "Amount", "Notes"],
    ...transactions.map((t) => [formatDate(t.date), t.projectName, t.type, t.category, String(t.amount), t.notes || ""]),
  ];

  const today = new Date().toISOString().slice(0, 10);
  return csvResponse(toCsv([...summary, [], ...ledger]), `swag-landscapes-export-${today}.csv`);
}
