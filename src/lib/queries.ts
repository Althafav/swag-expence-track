import { randomUUID } from "crypto";
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase, Project, Transaction } from "./db";
import { retentionCutoff } from "./bin";
import { COMPANY_LABEL } from "./categories";

export type ProjectWithTotals = Project & {
  income: number;
  expense: number;
  profit: number;
};

// SOFT DELETE: projects and transactions carry a nullable "deletedAt". NULL = live,
// a timestamp = in the recycle bin (see src/lib/bin.ts and /bin). Every read of
// live data below filters `deletedAt IS NULL`, and reads that span projects also
// exclude transactions whose project is binned. Any NEW read must do the same.
//
// COMPANY ENTRIES: a transaction with "projectId" NULL belongs to the whole
// business (salary, marketing, rent). `projects!inner(...)` joins skip those rows,
// so project-scoped reads never see them; whole-business reads add them on
// explicitly with `.is("projectId", null)` (see listCompanyTransactions).

type TxTotal = Pick<Transaction, "projectId" | "type" | "amount">;

// PostgREST caps every response at the project's "Max rows" setting (1000 by
// default) and truncates silently. Any read that isn't explicitly limited must
// go through fetchAll, or totals quietly stop adding up once the table grows.
// `page` must build a fresh query each call (builders are single-use) with a
// deterministic order, so pages don't overlap or skip rows.
const PAGE_SIZE = 1000;

async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

function sumBy(transactions: TxTotal[], projectId: string, type: "income" | "expense"): number {
  return transactions.filter((t) => t.projectId === projectId && t.type === type).reduce((s, t) => s + t.amount, 0);
}

export async function listProjects(): Promise<ProjectWithTotals[]> {
  const [projects, transactions] = await Promise.all([
    fetchAll<Project>((from, to) =>
      supabase
        .from("projects")
        .select("*")
        .is("deletedAt", null)
        .order("createdAt", { ascending: false })
        .order("id")
        .range(from, to)
    ),
    fetchAll<TxTotal>((from, to) =>
      supabase.from("transactions").select("projectId, type, amount").is("deletedAt", null).order("id").range(from, to)
    ),
  ]);

  return projects.map((p) => {
    const income = sumBy(transactions, p.id, "income");
    const expense = sumBy(transactions, p.id, "expense");
    return { ...p, income, expense, profit: income - expense };
  });
}

export async function getProject(id: string): Promise<Project | undefined> {
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).is("deletedAt", null).maybeSingle();
  if (error) throw error;
  return data ?? undefined;
}

export async function createProject(input: {
  name: string;
  location: string;
  client?: string | null;
  status?: string;
  startDate?: string | null;
  completedDate?: string | null;
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
    completedDate: input.completedDate ?? null,
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
    completedDate: string | null;
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
      completedDate: merged.completedDate,
      notes: merged.notes,
    })
    .eq("id", id);
  if (error) throw error;
  return getProject(id);
}

// Moves the project to the recycle bin. Only the project row is stamped — its
// transactions are left alone and simply stop counting while the project is
// binned (see the join filters below). That keeps delete AND restore a single
// atomic UPDATE, and a transaction deleted individually beforehand correctly
// stays in the bin after the project is restored. The hard delete (with the
// schema's ON DELETE CASCADE removing the transactions) is purgeProject().
export async function deleteProject(id: string): Promise<boolean> {
  const { error, count } = await supabase
    .from("projects")
    .update({ deletedAt: new Date().toISOString() }, { count: "exact" })
    .eq("id", id)
    .is("deletedAt", null);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function listTransactions(projectId: string): Promise<Transaction[]> {
  return fetchAll<Transaction>((from, to) =>
    supabase
      .from("transactions")
      .select("*")
      .eq("projectId", projectId)
      .is("deletedAt", null)
      .order("date", { ascending: false })
      .order("createdAt", { ascending: false })
      .order("id")
      .range(from, to)
  );
}

export type RecentTransaction = Transaction & { projectName: string };

export async function listRecentTransactions(limit: number): Promise<RecentTransaction[]> {
  const [{ data, error }, { data: company, error: companyError }] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, projects!inner(name)")
      .is("deletedAt", null)
      .is("projects.deletedAt", null)
      .order("date", { ascending: false })
      .order("createdAt", { ascending: false })
      .limit(limit),
    supabase
      .from("transactions")
      .select("*")
      .is("projectId", null)
      .is("deletedAt", null)
      .order("date", { ascending: false })
      .order("createdAt", { ascending: false })
      .limit(limit),
  ]);
  if (error) throw error;
  if (companyError) throw companyError;
  return [...(data ?? []), ...(company ?? [])].map(withProjectName).sort(newestFirst).slice(0, limit);
}

// Every live transaction — across live projects plus company entries — newest
// first. The "All activity" page and the whole-business export.
export async function listAllTransactions(): Promise<RecentTransaction[]> {
  const [rows, company] = await Promise.all([
    fetchAll((from, to) =>
      supabase
        .from("transactions")
        .select("*, projects!inner(name)")
        .is("deletedAt", null)
        .is("projects.deletedAt", null)
        .order("date", { ascending: false })
        .order("createdAt", { ascending: false })
        .order("id")
        .range(from, to)
    ),
    listCompanyTransactions(),
  ]);
  return [...rows, ...company].map(withProjectName).sort(newestFirst);
}

/** Live company entries (no project), newest first. */
export async function listCompanyTransactions(): Promise<Transaction[]> {
  return fetchAll<Transaction>((from, to) =>
    supabase
      .from("transactions")
      .select("*")
      .is("projectId", null)
      .is("deletedAt", null)
      .order("date", { ascending: false })
      .order("createdAt", { ascending: false })
      .order("id")
      .range(from, to)
  );
}

function newestFirst(a: Transaction, b: Transaction): number {
  return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
}

function withProjectName(row: unknown): RecentTransaction {
  const { projects, ...tx } = row as Transaction & { projects?: { name: string } | null };
  return { ...tx, projectName: tx.projectId === null ? COMPANY_LABEL : projects?.name ?? "" };
}

export async function createTransaction(input: {
  /** Null for a company entry. */
  projectId: string | null;
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
  const { data: existing, error: getError } = await supabase.from("transactions").select("*").eq("id", id).is("deletedAt", null).maybeSingle();
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

// Moves the transaction to the recycle bin (see deleteProject).
export async function deleteTransaction(id: string): Promise<boolean> {
  const { error, count } = await supabase
    .from("transactions")
    .update({ deletedAt: new Date().toISOString() }, { count: "exact" })
    .eq("id", id)
    .is("deletedAt", null);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export interface MonthlyPoint {
  month: string;
  income: number;
  expense: number;
}

// With a projectId: that project only. Without: the whole business — every live
// project plus company entries.
async function monthlyTrend(projectId?: string): Promise<MonthlyPoint[]> {
  const [rows, company] = await Promise.all([
    fetchAll<MonthlyRow>((from, to) => {
      let query = supabase
        .from("transactions")
        .select("date, type, amount, projects!inner(deletedAt)")
        .is("deletedAt", null)
        .is("projects.deletedAt", null);
      if (projectId) query = query.eq("projectId", projectId);
      return query.order("id").range(from, to);
    }),
    projectId
      ? Promise.resolve<MonthlyRow[]>([])
      : fetchAll<MonthlyRow>((from, to) =>
          supabase.from("transactions").select("date, type, amount").is("projectId", null).is("deletedAt", null).order("id").range(from, to)
        ),
  ]);
  return toMonthly([...rows, ...company]);
}

type MonthlyRow = Pick<Transaction, "date" | "type" | "amount">;

/** Groups rows into income/expense per "YYYY-MM", oldest month first. */
export function toMonthly(rows: MonthlyRow[]): MonthlyPoint[] {
  const map = new Map<string, MonthlyPoint>();
  for (const row of rows) {
    const month = row.date.slice(0, 7); // "YYYY-MM" from the stored "YYYY-MM-DD"
    if (!map.has(month)) map.set(month, { month, income: 0, expense: 0 });
    const entry = map.get(month)!;
    if (row.type === "income") entry.income += row.amount;
    else entry.expense += row.amount;
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export async function getDashboardData() {
  const [projects, monthly, company] = await Promise.all([listProjects(), monthlyTrend(), listCompanyTransactions()]);
  const projectIncome = projects.reduce((s, p) => s + p.income, 0);
  const projectExpense = projects.reduce((s, p) => s + p.expense, 0);
  const companyIncome = company.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const companyExpense = company.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalIncome = projectIncome + companyIncome;
  const totalExpense = projectExpense + companyExpense;

  return {
    projects,
    /** Profit from projects alone, before company entries. */
    projectProfit: projectIncome - projectExpense,
    companyIncome,
    companyExpense,
    totalIncome,
    totalExpense,
    /** Real business profit: projects plus company entries. */
    totalProfit: totalIncome - totalExpense,
    monthly,
  };
}

export async function getProjectMonthly(projectId: string): Promise<MonthlyPoint[]> {
  return monthlyTrend(projectId);
}

// ---------------------------------------------------------------------------
// Recycle bin
// ---------------------------------------------------------------------------

export type BinProject = Project & { deletedAt: string; transactionCount: number };
export type BinTransaction = Transaction & { deletedAt: string; projectName: string };

/**
 * Everything currently in the bin, newest-deleted first. Purges anything past
 * the retention window first (lazy — there's no cron). Transactions whose
 * project is itself binned are intentionally omitted: they ride along with the
 * project and are restored/purged with it.
 */
export async function listBin(): Promise<{ projects: BinProject[]; transactions: BinTransaction[] }> {
  await purgeExpired();

  const [
    { data: projects, error: projectsError },
    { data: transactions, error: txError },
    { data: company, error: companyError },
  ] = await Promise.all([
    supabase.from("projects").select("*").not("deletedAt", "is", null).order("deletedAt", { ascending: false }),
    supabase
      .from("transactions")
      .select("*, projects!inner(name)")
      .not("deletedAt", "is", null)
      .is("projects.deletedAt", null)
      .order("deletedAt", { ascending: false }),
    supabase.from("transactions").select("*").is("projectId", null).not("deletedAt", "is", null).order("deletedAt", { ascending: false }),
  ]);
  if (projectsError) throw projectsError;
  if (txError) throw txError;
  if (companyError) throw companyError;

  const projectIds = (projects ?? []).map((p) => p.id);
  const counts = new Map<string, number>();
  if (projectIds.length > 0) {
    // Filtered by projectIds, so every row here has a (non-null) project.
    const inside = await fetchAll<{ projectId: string }>((from, to) =>
      supabase.from("transactions").select("projectId").in("projectId", projectIds).is("deletedAt", null).order("id").range(from, to)
    );
    for (const row of inside) counts.set(row.projectId, (counts.get(row.projectId) ?? 0) + 1);
  }

  return {
    projects: (projects ?? []).map((p) => ({ ...p, transactionCount: counts.get(p.id) ?? 0 })),
    transactions: [...(transactions ?? []), ...(company ?? [])]
      .map((row) => withProjectName(row) as BinTransaction)
      .sort((a, b) => b.deletedAt.localeCompare(a.deletedAt)),
  };
}

export async function restoreProject(id: string): Promise<boolean> {
  const { error, count } = await supabase
    .from("projects")
    .update({ deletedAt: null }, { count: "exact" })
    .eq("id", id)
    .not("deletedAt", "is", null);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export type RestoreTransactionResult = "ok" | "not_found" | "project_deleted";

export async function restoreTransaction(id: string): Promise<RestoreTransactionResult> {
  // Left join (not !inner): a company entry has no project to join.
  const { data, error: getError } = await supabase
    .from("transactions")
    .select("id, projects(deletedAt)")
    .eq("id", id)
    .not("deletedAt", "is", null)
    .maybeSingle();
  if (getError) throw getError;
  if (!data) return "not_found";

  const project = (data as unknown as { projects: { deletedAt: string | null } | null }).projects;
  if (project?.deletedAt) return "project_deleted";

  const { error } = await supabase.from("transactions").update({ deletedAt: null }).eq("id", id);
  if (error) throw error;
  return "ok";
}

// Permanent deletes. They only match rows already in the bin, so a live row can
// never be hard-deleted through them. Purging a project cascades to all of its
// transactions via the schema's ON DELETE CASCADE.
export async function purgeProject(id: string): Promise<boolean> {
  const { error, count } = await supabase
    .from("projects")
    .delete({ count: "exact" })
    .eq("id", id)
    .not("deletedAt", "is", null);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function purgeTransaction(id: string): Promise<boolean> {
  const { error, count } = await supabase
    .from("transactions")
    .delete({ count: "exact" })
    .eq("id", id)
    .not("deletedAt", "is", null);
  if (error) throw error;
  return (count ?? 0) > 0;
}

/** Permanently deletes everything in the bin (binned projects take their transactions with them). */
export async function emptyBin(): Promise<void> {
  const { error: projectsError } = await supabase.from("projects").delete().not("deletedAt", "is", null);
  if (projectsError) throw projectsError;
  const { error: txError } = await supabase.from("transactions").delete().not("deletedAt", "is", null);
  if (txError) throw txError;
}

/** Hard-deletes bin rows older than the retention window. */
export async function purgeExpired(): Promise<void> {
  const cutoff = retentionCutoff();
  const { error: projectsError } = await supabase.from("projects").delete().lt("deletedAt", cutoff);
  if (projectsError) throw projectsError;
  const { error: txError } = await supabase.from("transactions").delete().lt("deletedAt", cutoff);
  if (txError) throw txError;
}
