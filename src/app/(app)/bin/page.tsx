import RecycleBinClient from "@/components/RecycleBinClient";
import { listBin } from "@/lib/queries";

// See src/app/(app)/page.tsx for why this can't be statically cached.
export const dynamic = "force-dynamic";

export default async function RecycleBinPage() {
  const { projects, transactions } = await listBin();
  return <RecycleBinClient projects={projects} transactions={transactions} />;
}
