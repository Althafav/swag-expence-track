import { NextResponse } from "next/server";
import { emptyBin } from "@/lib/queries";

/** Permanently deletes everything in the recycle bin. */
export async function DELETE() {
  await emptyBin();
  return NextResponse.json({ ok: true });
}
