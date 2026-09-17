import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, "app.db"));

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    client TEXT,
    status TEXT NOT NULL DEFAULT 'ongoing',
    startDate TEXT,
    notes TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    notes TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_projectId ON transactions(projectId);
  CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
`);

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
