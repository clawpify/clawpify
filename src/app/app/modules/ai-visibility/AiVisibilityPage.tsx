import { AiVisibilityHeader } from "./AiVisibilityHeader";
import { ProductsExport } from "./ProductsExport";
import { PeopleExport } from "./PeopleExport";

export function AiVisibilityPage() {
  return (
    <>
      <AiVisibilityHeader />
      <main className="flex-1 overflow-y-auto px-6 py-4">
        <ProductsExport />
        <PeopleExport />
      </main>
    </>
  );
}
