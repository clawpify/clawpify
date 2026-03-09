import { copy } from "../../utils/copy";

export function ProductsExport() {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-gray-900">
        {copy.aiVisibility.productsTitle}
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        {copy.aiVisibility.productsDesc}
      </p>
      <p className="mt-3 text-sm text-gray-400">
        {copy.aiVisibility.productsEmpty}
      </p>
    </section>
  );
}
