import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { convertQuoteToProject } from "@/lib/queries";

/** Creates a project from the quote and links them. */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await convertQuoteToProject(id);
  if (!result.ok) {
    return result.reason === "not_found"
      ? NextResponse.json({ error: "Not found" }, { status: 404 })
      : NextResponse.json({ error: "This quote already has a project" }, { status: 409 });
  }
  return NextResponse.json({ projectId: result.projectId }, { status: 201 });
}
