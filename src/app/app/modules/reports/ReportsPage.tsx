import { ReportsHeader } from "./ReportsHeader";
import { ReportsContent } from "./ReportsContent";

export function ReportsPage() {
  return (
    <>
      <ReportsHeader />
      <main className="flex-1 overflow-y-auto">
        <ReportsContent />
      </main>
    </>
  );
}
