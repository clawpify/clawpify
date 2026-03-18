import { useLocation } from "react-router-dom";
import "./index.css";
import { AppShell } from "./shell/AppShell";
import { AppTopNav } from "./shell/AppTopNav";
import { AppRoutes } from "./shell/AppRoutes";

export function App() {
  const { pathname } = useLocation();
  const fullBleed = isFullBleedShell(pathname);

  return (
    <AppShell fullBleed={fullBleed}>
      {!fullBleed && <AppTopNav />}
      <AppRoutes />
    </AppShell>
  );
}

export default App;

/**
 * 
 * @param pathname - The pathname to check.
 * @returns 
 */
function isFullBleedShell(p: string): boolean {
  if (p === "/" || p === "/about") return true;
  if (p === "/sign-in" || p === "/sign-up") return true;
  if (p === "/blog" || p.startsWith("/blog/")) return true;
  if (p === "/writing" || p.startsWith("/writing/")) return true;
  if (p === "/app" || p.startsWith("/app/")) return true;
  return false;
}
