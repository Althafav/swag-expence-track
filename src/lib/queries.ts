import { randomUUID } from "crypto";
import { supabase, Project, Transaction } from "./db";

export type ProjectWithTotals = Project & {
  income: number;
  expense: number;
  profit: number;
};

type TxTotal = Pick<Transaction, "projectId" | "type" | "amount">;

function sumBy(transactions: TxTotal[], projectId: string, type: "income" | "expense"): number {
  return transactions.filter((t) => t.projectId === projectId && t.type === type).reduce((s, t) => s + t.amount, 0);
}

export async function listProjects(): Promise<ProjectWithTotals[]> {
  const [{ data: projects, error: projectsError }, { data: transactions, error: txError }] = await Promise.all([
    supabase.from("projects").select("*").order("createdAt", { ascending: false }),
    supabase.from("transactions").select("projectId, type, amount"),
  ]);
  if (projectsError) throw projectsError;
  if (txError) throw txError;

  return (projects ?? []).map((p) => {
    const income = sumBy(transactions ?? [], p.id, "income");
    const expense = sumBy(transactions ?? [], p.id, "expense");
    return { ...p, income, expense, profit: income - expense };
  });
}

export async function getProject(id: string): Promise<Project | undefined> {
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ?? undefined;
}

export async function createProject(input: {
  name: string;
  location: string;
  client?: string | null;
  status?: string;
  startDate?: string | null;
  notes?: string | null;
}): Promise<Project | undefined> {
  const id = randomUUID();
  const { error } = await supabase.from("projects").insert({
    id,
    name: input.name,
    location: input.location,
    client: input.client ?? null,
    status: input.status ?? "ongoing",
    startDate: input.startDate ?? null,
    notes: input.notes ?? null,
  });
  if (error) throw error;
  return getProject(id);
}

export async function updateProject(
  id: string,
  input: Partial<{
    name: string;
    location: string;
    client: string | null;
    status: string;
    startDate: string | null;
    notes: string | null;
  }>
): Promise<Project | undefined> {
  const existing = await getProject(id);
  if (!existing) return undefined;
  const merged = { ...existing, ...input };
  const { error } = await supabase
    .from("projects")
    .update({
      name: merged.name,
      location: merged.location,
      client: merged.client,
      status: merged.status,
      startDate: merged.startDate,
      notes: merged.notes,
    })
    .eq("id", id);
  if (error) throw error;
  return getProject(id);
}

// Postgres's own ON DELETE CASCADE (schema FK) handles removing the project's
// transactions atomically as part of this single statement — unlike the old
// SQLite version, no separate explicit-cascade step is needed or easily
// achievable over PostgREST's one-statement-per-call model.
export async function deleteProject(id: string): Promise<boolean> {
  const { error, count } = await supabase.from("projects").delete({ count: "exact" }).eq("id", id);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function listTransactions(projectId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("projectId", projectId)
    .order("date", { ascending: false })
    .order("createdAt", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export type RecentTransaction = Transaction & { projectName: string };

export async function listRecentTransactions(limit: number): Promise<RecentTransaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*, projects(name)")
    .order("date", { ascending: false })
    .order("createdAt", { ascending: false })
    .limit(limit);
  if (error) throw error;

  return (data ?? []).map((row) => {
    const { projects, ...tx } = row as Transaction & { projects: { name: string } | null };
    return { ...tx, projectName: projects?.name ?? "" };
  });
}

export async function createTransaction(input: {
  projectId: string;
  type: string;
  amount: number;
  date: string;
  category: string;
  notes?: string | null;
}): Promise<Transaction> {
  const id = randomUUID();
  const { error } = await supabase.from("transactions").insert({
    id,
    projectId: input.projectId,
    type: input.type,
    amount: input.amount,
    date: input.date,
    category: input.category,
    notes: input.notes ?? null,
  });
  if (error) throw error;

  const { data, error: getError } = await supabase.from("transactions").select("*").eq("id", id).single();
  if (getError) throw getError;
  return data;
}

export async function updateTransaction(
  id: string,
  input: Partial<{ type: string; amount: number; date: string; category: string; notes: string | null }>
): Promise<Transaction | undefined> {
  const { data: existing, error: getError } = await supabase.from("transactions").select("*").eq("id", id).maybeSingle();
  if (getError) throw getError;
  if (!existing) return undefined;

  const merged = { ...existing, ...input };
  const { error } = await supabase
    .from("transactions")
    .update({
      type: merged.type,
      amount: merged.amount,
      date: merged.date,
      category: merged.category,
      notes: merged.notes,
    })
    .eq("id", id);
  if (error) throw error;

  const { data, error: finalError } = await supabase.from("transactions").select("*").eq("id", id).single();
  if (finalError) throw finalError;
  return data;
}

export async function deleteTransaction(id: string): Promise<boolean> {
  const { error, count } = await supabase.from("transactions").delete({ count: "exact" }).eq("id", id);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export interface MonthlyPoint {
  month: string;
  income: number;
  expense: number;
}

async function monthlyTrend(projectId?: string): Promise<MonthlyPoint[]> {
  let query = supabase.from("transactions").select("date, type, amount");
  if (projectId) query = query.eq("projectId", projectId);
  const { data, error } = await query;
  if (error) throw error;

  const map = new Map<string, MonthlyPoint>();
  for (const row of data ?? []) {
    const month = row.date.slice(0, 7); // "YYYY-MM" from the stored "YYYY-MM-DD"
    if (!map.has(month)) map.set(month, { month, income: 0, expense: 0 });
    const entry = map.get(month)!;
    if (row.type === "income") entry.income += row.amount;
    else entry.expense += row.amount;
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export async function getDashboardData() {
  const projects = await listProjects();
  const totalIncome = projects.reduce((s, p) => s + p.income, 0);
  const totalExpense = projects.reduce((s, p) => s + p.expense, 0);

  return {
    projects,
    totalIncome,
    totalExpense,
    totalProfit: totalIncome - totalExpense,
    monthly: await monthlyTrend(),
  };
}

export async function getProjectMonthly(projectId: string): Promise<MonthlyPoint[]> {
  return monthlyTrend(projectId);
}
