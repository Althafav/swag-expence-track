import CompanyClient from "@/components/CompanyClient";
import { listCompanyTransactions, toMonthly } from "@/lib/queries";

// See src/app/(app)/page.tsx for why this can't be statically cached.
export const dynamic = "force-dynamic";

export default async function CompanyPage() {
  const transactions = await listCompanyTransactions();
  return <CompanyClient transactions={transactions} monthly={toMonthly(transactions)} />;
}
