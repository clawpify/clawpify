export function pathRequiresClerk(pathname: string): boolean {
  if (pathname.startsWith("/app")) return true;
  if (pathname === "/sign-in") return true;
  return false;
}
