import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createTransaction, getProject } from "@/lib/queries";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.projectId || !body?.type || !body?.amount || !body?.date || !body?.category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // A soft-deleted project still satisfies the FK, so check it's live — otherwise
  // the transaction would be logged into the recycle bin and vanish.
  if (!(await getProject(body.projectId))) {
    return NextResponse.json({ error: "Project not found" }, { status: 400 });
  }

  const tx = await createTransaction({
    projectId: body.projectId,
    type: body.type,
    amount: Number(body.amount),
    date: body.date,
    category: body.category,
    notes: body.notes ?? null,
  });
  return NextResponse.json(tx, { status: 201 });
}
