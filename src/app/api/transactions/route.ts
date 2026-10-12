import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createTransaction, getProject } from "@/lib/queries";
import { parseTransaction } from "@/lib/validate";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  // An explicit null projectId is a company entry (salary, marketing, ...); a
  // missing or empty one is a form bug, not a request for a company entry.
  const isCompany = body?.projectId === null;
  const projectId = typeof body?.projectId === "string" ? body.projectId : "";
  if (!isCompany && !projectId) return NextResponse.json({ error: "Project is required" }, { status: 400 });

  const parsed = parseTransaction(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  if (isCompany) {
    const tx = await createTransaction({ projectId: null, ...parsed.value });
    return NextResponse.json(tx, { status: 201 });
  }

  // A soft-deleted project still satisfies the FK, so check it's live — otherwise
  // the transaction would be logged into the recycle bin and vanish.
  if (!(await getProject(projectId))) {
    return NextResponse.json({ error: "Project not found" }, { status: 400 });
  }

  const tx = await createTransaction({ projectId, ...parsed.value });
  return NextResponse.json(tx, { status: 201 });
}
