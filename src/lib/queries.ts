import { randomUUID } from "crypto";
import { db, Project, Transaction } from "./db";

export type ProjectWithTotals = Project & {
  income: number;
  expense: number;
  profit: number;
};

export function listProjects(): ProjectWithTotals[] {
  const projects = db.prepare(`SELECT * FROM projects ORDER BY createdAt DESC`).all() as Project[];
  const totals = db
    .prepare(`SELECT projectId, type, SUM(amount) as total FROM transactions GROUP BY projectId, type`)
    .all() as { projectId: string; type: string; total: number }[];

  return projects.map((p) => {
    const income = totals.find((t) => t.projectId === p.id && t.type === "income")?.total ?? 0;
    const expense = totals.find((t) => t.projectId === p.id && t.type === "expense")?.total ?? 0;
    return { ...p, income, expense, profit: income - expense };
  });
}

export function getProject(id: string): Project | undefined {
  return db.prepare(`SELECT * FROM projects WHERE id = ?`).get(id) as Project | undefined;
}

export function createProject(input: {
  name: string;
  location: string;
  client?: string | null;
  status?: string;
  startDate?: string | null;
  notes?: string | null;
}) {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO projects (id, name, location, client, status, startDate, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.name,
    input.location,
    input.client ?? null,
    input.status ?? "ongoing",
    input.startDate ?? null,
    input.notes ?? null
  );
  return getProject(id);
}

export function updateProject(
  id: string,
  input: Partial<{
    name: string;
    location: string;
    client: string | null;
    status: string;
    startDate: string | null;
    notes: string | null;
  }>
) {
  const existing = getProject(id);
  if (!existing) return undefined;
  const merged = { ...existing, ...input };
  db.prepare(
    `UPDATE projects SET name=?, location=?, client=?, status=?, startDate=?, notes=? WHERE id=?`
  ).run(merged.name, merged.location, merged.client, merged.status, merged.startDate, merged.notes, id);
  return getProject(id);
}

// Explicit cascading delete, belt-and-braces alongside the schema's own
// ON DELETE CASCADE + PRAGMA foreign_keys — deleting a project must never
// leave orphaned transactions skewing dashboard totals.
const deleteProjectCascade = db.transaction((id: string) => {
  db.prepare(`DELETE FROM transactions WHERE projectId = ?`).run(id);
  return db.prepare(`DELETE FROM projects WHERE id = ?`).run(id);
});

export function deleteProject(id: string): boolean {
  const result = deleteProjectCascade(id);
  return result.changes > 0;
}

export function listTransactions(projectId: string): Transaction[] {
  return db
    .prepare(`SELECT * FROM transactions WHERE projectId = ? ORDER BY date DESC, createdAt DESC`)
    .all(projectId) as Transaction[];
}

export type RecentTransaction = Transaction & { projectName: string };

export function listRecentTransactions(limit: number): RecentTransaction[] {
  return db
    .prepare(
      `SELECT t.*, p.name as projectName
       FROM transactions t
       JOIN projects p ON p.id = t.projectId
       ORDER BY t.date DESC, t.createdAt DESC
       LIMIT ?`
    )
    .all(limit) as RecentTransaction[];
}

export function createTransaction(input: {
  projectId: string;
  type: string;
  amount: number;
  date: string;
  category: string;
  notes?: string | null;
}): Transaction {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO transactions (id, projectId, type, amount, date, category, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, input.projectId, input.type, input.amount, input.date, input.category, input.notes ?? null);
  return db.prepare(`SELECT * FROM transactions WHERE id = ?`).get(id) as Transaction;
}

export function updateTransaction(
  id: string,
  input: Partial<{ type: string; amount: number; date: string; category: string; notes: string | null }>
) {
  const existing = db.prepare(`SELECT * FROM transactions WHERE id = ?`).get(id) as Transaction | undefined;
  if (!existing) return undefined;
  const merged = { ...existing, ...input };
  db.prepare(`UPDATE transactions SET type=?, amount=?, date=?, category=?, notes=? WHERE id=?`).run(
    merged.type,
    merged.amount,
    merged.date,
    merged.category,
    merged.notes,
    id
  );
  return db.prepare(`SELECT * FROM transactions WHERE id = ?`).get(id) as Transaction;
}

export function deleteTransaction(id: string): boolean {
  const result = db.prepare(`DELETE FROM transactions WHERE id = ?`).run(id);
  return result.changes > 0;
}

export interface MonthlyPoint {
  month: string;
  income: number;
  expense: number;
}

function monthlyTrend(where: string, params: unknown[]): MonthlyPoint[] {
  const rows = db
    .prepare(
      `SELECT strftime('%Y-%m', date) as month, type, SUM(amount) as total
       FROM transactions ${where}
       GROUP BY month, type ORDER BY month ASC`
    )
    .all(...params) as { month: string; type: string; total: number }[];

  const map = new Map<string, MonthlyPoint>();
  for (const row of rows) {
    if (!map.has(row.month)) map.set(row.month, { month: row.month, income: 0, expense: 0 });
    const entry = map.get(row.month)!;
    if (row.type === "income") entry.income = row.total;
    else entry.expense = row.total;
  }
  return Array.from(map.values());
}

export function getDashboardData() {
  const projects = listProjects();
  const totalIncome = projects.reduce((s, p) => s + p.income, 0);
  const totalExpense = projects.reduce((s, p) => s + p.expense, 0);

  return {
    projects,
    totalIncome,
    totalExpense,
    totalProfit: totalIncome - totalExpense,
    monthly: monthlyTrend("", []),
  };
}

export function getProjectMonthly(projectId: string): MonthlyPoint[] {
  return monthlyTrend("WHERE projectId = ?", [projectId]);
}
