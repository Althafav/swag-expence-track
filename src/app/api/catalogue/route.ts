import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createCatalogueItem, listCatalogue } from "@/lib/queries";
import { parseCatalogueItem } from "@/lib/validate";

export async function GET() {
  return NextResponse.json(await listCatalogue());
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = parseCatalogueItem(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  return NextResponse.json(await createCatalogueItem(parsed.value), { status: 201 });
}
