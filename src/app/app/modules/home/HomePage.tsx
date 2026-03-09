import { HomeHeader } from "./HomeHeader";
import { HomeContent } from "./HomeContent";

export function HomePage() {
  return (
    <>
      <HomeHeader />
      <main className="flex-1 overflow-y-auto">
        <HomeContent />
      </main>
    </>
  );
}
