// Pure, client-safe helpers for the recycle bin (no server imports — the bin
// UI and queries.ts both use these).

/** Days a deleted project/transaction stays restorable before it's purged. */
export const RETENTION_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/** ISO timestamp: anything deleted before this has outlived the retention window. */
export function retentionCutoff(now = Date.now()): string {
  return new Date(now - RETENTION_DAYS * DAY_MS).toISOString();
}

/** Whole days left before `deletedAt` is purged (never below 0). */
export function daysLeft(deletedAt: string, now = Date.now()): number {
  const expires = new Date(deletedAt).getTime() + RETENTION_DAYS * DAY_MS;
  return Math.max(0, Math.ceil((expires - now) / DAY_MS));
}

/** Whole days since `deletedAt`. */
export function daysSince(deletedAt: string, now = Date.now()): number {
  return Math.max(0, Math.floor((now - new Date(deletedAt).getTime()) / DAY_MS));
}
