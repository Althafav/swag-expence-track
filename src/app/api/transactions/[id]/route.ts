import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { deleteTransaction, updateTransaction } from "@/lib/queries";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body?.type || !body?.amount || !body?.date || !body?.category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const tx = await updateTransaction(id, {
    type: body.type,
    amount: Number(body.amount),
    date: body.date,
    category: body.category,
    notes: body.notes ?? null,
  });
  if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tx);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = await deleteTransaction(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
