import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createTransaction, getProject } from "@/lib/queries";
import { parseTransaction } from "@/lib/validate";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const projectId = typeof body?.projectId === "string" ? body.projectId : "";
  if (!projectId) return NextResponse.json({ error: "Project is required" }, { status: 400 });

  const parsed = parseTransaction(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  // A soft-deleted project still satisfies the FK, so check it's live — otherwise
  // the transaction would be logged into the recycle bin and vanish.
  if (!(await getProject(projectId))) {
    return NextResponse.json({ error: "Project not found" }, { status: 400 });
  }

  const tx = await createTransaction({ projectId, ...parsed.value });
  return NextResponse.json(tx, { status: 201 });
}
