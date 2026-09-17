import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { deleteProject, getProject, updateProject } from "@/lib/queries";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getProject(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.location) {
    return NextResponse.json({ error: "Name and location are required" }, { status: 400 });
  }

  const project = updateProject(id, {
    name: body.name,
    location: body.location,
    client: body.client ?? null,
    status: body.status,
    startDate: body.startDate ?? null,
    notes: body.notes ?? null,
  });
  return NextResponse.json(project);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = deleteProject(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
