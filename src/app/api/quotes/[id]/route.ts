import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { deleteQuote, getQuote, updateQuote } from "@/lib/queries";
import { parseQuote } from "@/lib/validate";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const quote = await getQuote(id);
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(quote);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = parseQuote(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const quote = await updateQuote(id, parsed.value);
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(quote);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const ok = await deleteQuote(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
