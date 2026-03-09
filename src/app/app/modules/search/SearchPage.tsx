import { SearchHeader } from "./SearchHeader";
import { SearchOptimizer } from "./SearchOptimizer";

export function SearchPage() {
  return (
    <>
      <SearchHeader />
      <main className="flex-1 overflow-y-auto">
        <SearchOptimizer />
      </main>
    </>
  );
}
