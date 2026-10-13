import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { purgeProject, purgeQuote, purgeTransaction, restoreProject, restoreQuote, restoreTransaction } from "@/lib/queries";

type Params = { params: Promise<{ kind: string; id: string }> };

/** Restore an item from the recycle bin. `kind` is "projects", "transactions" or "quotes". */
export async function POST(_request: NextRequest, { params }: Params) {
  const { kind, id } = await params;

  if (kind === "projects") {
    if (!(await restoreProject(id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  if (kind === "quotes") {
    if (!(await restoreQuote(id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  if (kind === "transactions") {
    const result = await restoreTransaction(id);
    if (result === "not_found") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (result === "project_deleted") {
      return NextResponse.json({ error: "Restore the project first" }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

/** Permanently delete one item that's already in the recycle bin. */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { kind, id } = await params;

  const purgers: Record<string, (id: string) => Promise<boolean>> = {
    projects: purgeProject,
    transactions: purgeTransaction,
    quotes: purgeQuote,
  };
  const purge = Object.hasOwn(purgers, kind) ? purgers[kind] : undefined;
  if (!purge) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = await purge(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
