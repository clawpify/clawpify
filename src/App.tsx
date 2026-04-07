import { lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import "./index.css";
import { pathRequiresClerk } from "./lib/path-requires-clerk.ts";
import { AppShell } from "./shell/AppShell";
import { AppRoutes } from "./shell/AppRoutes";

const ClerkAppChrome = lazy(() =>
  import("./shell/ClerkAppChrome.tsx").then((m) => ({ default: m.ClerkAppChrome })),
);

export function App() {
  const { pathname } = useLocation();
  const fullBleed = isFullBleedShell(pathname);
  const clerk = pathRequiresClerk(pathname);

  return (
    <AppShell fullBleed={fullBleed}>
      {clerk && (
        <Suspense fallback={null}>
          <ClerkAppChrome fullBleed={fullBleed} />
        </Suspense>
      )}
      <AppRoutes />
    </AppShell>
  );
}

export default App;

function isFullBleedShell(p: string): boolean {
  if (p === "/" || p === "/about" || p === "/privacy") return true;
  if (p === "/sign-in") return true;
  if (p === "/blog" || p.startsWith("/blog/")) return true;
  if (p === "/writing" || p.startsWith("/writing/")) return true;
  if (p === "/app" || p.startsWith("/app/")) return true;
  return false;
}
