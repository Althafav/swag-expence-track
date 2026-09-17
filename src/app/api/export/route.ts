import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProject, listTransactions } from "@/lib/queries";
import { formatDate } from "@/lib/format";

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

  const project = getProject(projectId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const transactions = listTransactions(projectId);
  const header = ["Date", "Type", "Category", "Amount", "Notes"];
  const rows = transactions.map((t) => [formatDate(t.date), t.type, t.category, String(t.amount), t.notes || ""]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");

  const filename = `${project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-transactions.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
