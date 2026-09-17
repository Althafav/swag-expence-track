import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createTransaction } from "@/lib/queries";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.projectId || !body?.type || !body?.amount || !body?.date || !body?.category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const tx = createTransaction({
    projectId: body.projectId,
    type: body.type,
    amount: Number(body.amount),
    date: body.date,
    category: body.category,
    notes: body.notes ?? null,
  });
  return NextResponse.json(tx, { status: 201 });
}
