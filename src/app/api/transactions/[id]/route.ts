import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { deleteTransaction, updateTransaction } from "@/lib/queries";
import { parseTransaction } from "@/lib/validate";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = parseTransaction(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const tx = await updateTransaction(id, parsed.value);
  if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tx);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = await deleteTransaction(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
