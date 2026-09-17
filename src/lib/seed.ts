// Seeds the database with the SWAG Landscapes design system's sample dataset
// (SWAG Landscapes Design System/ui_kits/profit-tracker/data.js), with its
// display dates ("04 Aug 2026") converted to ISO storage dates. Idempotent —
// does nothing if the database already has projects.
import { fileURLToPath } from "url";
import { parse, format } from "date-fns";
import { db } from "./db";
import { createProject, createTransaction, listProjects } from "./queries";

function iso(displayDate: string): string {
  return format(parse(displayDate, "dd MMM yyyy", new Date()), "yyyy-MM-dd");
}

const PROJECTS = [
  {
    key: "p1",
    name: "Alder Ridge driveway",
    location: "Sector 42, Gurugram",
    client: "R. Malhotra",
    status: "ongoing",
    start: "04 Aug 2026",
    notes: "Interlock paving, 2400 sq ft. Client wants charcoal border course.",
  },
  {
    key: "p2",
    name: "Fern Hollow turf lawn",
    location: "Vasant Kunj, Delhi",
    client: "Fern Hollow RWA",
    status: "ongoing",
    start: "18 Aug 2026",
    notes: "Grass/turf over 3.2 acres. Two subcontractor crews.",
  },
  {
    key: "p3",
    name: "Birchwood clinic cladding",
    location: "Sushant Lok, Gurugram",
    client: "Birchwood Dental",
    status: "completed",
    start: "02 Jun 2026",
    notes: "Wall cladding stone, front elevation.",
  },
  {
    key: "p4",
    name: "Sable Court forecourt",
    location: "Golf Course Rd",
    client: null,
    status: "on_hold",
    start: "22 Jul 2026",
    notes: "Paused pending revised drawings.",
  },
  {
    key: "p5",
    name: "Quarry Lane retaining wall",
    location: "Faridabad",
    client: "S. Iyer",
    status: "completed",
    start: "11 May 2026",
    notes: "",
  },
] as const;

const TRANSACTIONS: Record<
  (typeof PROJECTS)[number]["key"],
  { type: "income" | "expense"; amount: number; date: string; category: string; notes: string }[]
> = {
  p1: [
    { type: "income", amount: 300000, date: "04 Aug 2026", category: "Advance payment", notes: "50% advance" },
    { type: "expense", amount: 186000, date: "07 Aug 2026", category: "Materials · Interlock/Paving", notes: "2400 sq ft + border" },
    { type: "expense", amount: 94000, date: "12 Aug 2026", category: "Labor", notes: "6 masons, 9 days" },
    { type: "income", amount: 340000, date: "28 Aug 2026", category: "Milestone payment", notes: "Base course signed off" },
    { type: "expense", amount: 78000, date: "02 Sep 2026", category: "Equipment rental", notes: "Plate compactor, cutter" },
    { type: "expense", amount: 54000, date: "09 Sep 2026", category: "Transport/Fuel", notes: "4 tipper loads" },
  ],
  p2: [
    { type: "income", amount: 310000, date: "18 Aug 2026", category: "Advance payment", notes: "" },
    { type: "expense", amount: 212000, date: "21 Aug 2026", category: "Materials · Grass/Turf", notes: "Bermuda, 3.2 acres" },
    { type: "expense", amount: 96000, date: "30 Aug 2026", category: "Subcontractor", notes: "Levelling crew" },
    { type: "expense", amount: 40000, date: "08 Sep 2026", category: "Misc", notes: "Site water tanker" },
  ],
  p3: [
    { type: "income", amount: 620000, date: "02 Jun 2026", category: "Advance payment", notes: "" },
    { type: "expense", amount: 468000, date: "09 Jun 2026", category: "Materials · Cladding stone", notes: "Kota + granite" },
    { type: "expense", amount: 237000, date: "24 Jun 2026", category: "Labor", notes: "" },
    { type: "income", amount: 620000, date: "16 Jul 2026", category: "Final payment", notes: "Handover" },
  ],
  p4: [
    { type: "income", amount: 90000, date: "22 Jul 2026", category: "Advance payment", notes: "" },
    { type: "expense", amount: 148000, date: "29 Jul 2026", category: "Materials · Other", notes: "Kerb stone (already cut)" },
  ],
  p5: [
    { type: "income", amount: 520000, date: "11 May 2026", category: "Final payment", notes: "Paid in full" },
    { type: "expense", amount: 361000, date: "19 May 2026", category: "Materials · Other", notes: "Block + rebar" },
  ],
};

export function seed() {
  if (listProjects().length > 0) {
    console.log("Database already has projects — skipping seed.");
    return;
  }

  const seedInsert = db.transaction(() => {
    for (const p of PROJECTS) {
      const created = createProject({
        name: p.name,
        location: p.location,
        client: p.client,
        status: p.status,
        startDate: iso(p.start),
        notes: p.notes || null,
      });
      if (!created) throw new Error(`Failed to create project ${p.name}`);

      for (const t of TRANSACTIONS[p.key]) {
        createTransaction({
          projectId: created.id,
          type: t.type,
          amount: t.amount,
          date: iso(t.date),
          category: t.category,
          notes: t.notes || null,
        });
      }
    }
  });

  seedInsert();
  console.log(`Seeded ${PROJECTS.length} projects.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  seed();
}
