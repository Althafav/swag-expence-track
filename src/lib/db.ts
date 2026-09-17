import { createClient } from "@supabase/supabase-js";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

// Server-only client. Uses the service_role key (never NEXT_PUBLIC_-prefixed)
// so it bypasses Row Level Security — this app's real access control is its
// own passcode auth in src/proxy.ts, not Supabase Auth/RLS. Never import this
// module from a "use client" component.
export const supabase = createClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

export interface Project {
  id: string;
  name: string;
  location: string;
  client: string | null;
  status: "ongoing" | "completed" | "on_hold";
  startDate: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Transaction {
  id: string;
  projectId: string;
  type: "income" | "expense";
  amount: number;
  date: string;
  category: string;
  notes: string | null;
  createdAt: string;
}
