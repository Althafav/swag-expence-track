import CatalogueClient from "@/components/CatalogueClient";
import { listCatalogue } from "@/lib/queries";

// See src/app/(app)/page.tsx for why this can't be statically cached.
export const dynamic = "force-dynamic";

export default async function CataloguePage() {
  return <CatalogueClient items={await listCatalogue()} />;
}
