import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { purgeProject, purgeTransaction, restoreProject, restoreTransaction } from "@/lib/queries";

type Params = { params: Promise<{ kind: string; id: string }> };

/** Restore an item from the recycle bin. `kind` is "projects" or "transactions". */
export async function POST(_request: NextRequest, { params }: Params) {
  const { kind, id } = await params;

  if (kind === "projects") {
    if (!(await restoreProject(id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  if (kind !== "projects" && kind !== "transactions") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ok = kind === "projects" ? await purgeProject(id) : await purgeTransaction(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
