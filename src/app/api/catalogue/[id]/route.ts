import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { deleteCatalogueItem, updateCatalogueItem } from "@/lib/queries";
import { parseCatalogueItem } from "@/lib/validate";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = parseCatalogueItem(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const item = await updateCatalogueItem(id, parsed.value);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

/** Catalogue items are templates, so this is a real delete (no recycle bin). */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!(await deleteCatalogueItem(id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
