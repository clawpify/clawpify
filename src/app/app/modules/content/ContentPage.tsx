import { ContentHeader } from "./ContentHeader";
import { ContentEditor } from "./ContentEditor";

export function ContentPage() {
  return (
    <>
      <ContentHeader />
      <main className="flex-1 overflow-y-auto">
        <ContentEditor />
      </main>
    </>
  );
}
