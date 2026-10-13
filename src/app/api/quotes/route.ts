import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createQuote, listQuotes } from "@/lib/queries";
import { parseQuote } from "@/lib/validate";

export async function GET() {
  return NextResponse.json(await listQuotes());
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = parseQuote(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const quote = await createQuote(parsed.value);
  return NextResponse.json(quote, { status: 201 });
}
