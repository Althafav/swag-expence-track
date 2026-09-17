import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createProject, listProjects } from "@/lib/queries";

export async function GET() {
  return NextResponse.json(listProjects());
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.location) {
    return NextResponse.json({ error: "Name and location are required" }, { status: 400 });
  }

  const project = createProject({
    name: body.name,
    location: body.location,
    client: body.client ?? null,
    status: body.status || "ongoing",
    startDate: body.startDate ?? null,
    notes: body.notes ?? null,
  });
  return NextResponse.json(project, { status: 201 });
}
