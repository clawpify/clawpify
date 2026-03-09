import { AgentsHeader } from "./AgentsHeader";
import { AgentsContent } from "./AgentsContent";

export function AgentsPage() {
  return (
    <>
      <AgentsHeader />
      <main className="flex-1 overflow-y-auto">
        <AgentsContent />
      </main>
    </>
  );
}
