import { StoresHeader } from "./StoresHeader";
import { StoresTable } from "./StoresTable";

export function StoresPage() {
  return (
    <>
      <StoresHeader />
      <main className="flex-1 overflow-y-auto">
        <StoresTable />
      </main>
    </>
  );
}
