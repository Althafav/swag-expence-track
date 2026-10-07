import ActivityClient from "@/components/ActivityClient";
import { listAllTransactions } from "@/lib/queries";

// See src/app/(app)/page.tsx for why this can't be statically cached.
export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const transactions = await listAllTransactions();
  return <ActivityClient transactions={transactions} />;
}
