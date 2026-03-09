import { copy } from "../../utils/copy";

export function PeopleExport() {
  return (
    <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-gray-900">
        {copy.aiVisibility.peopleTitle}
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        {copy.aiVisibility.peopleDesc}
      </p>
      <p className="mt-3 text-sm text-gray-400">
        {copy.aiVisibility.peopleEmpty}
      </p>
    </section>
  );
}
