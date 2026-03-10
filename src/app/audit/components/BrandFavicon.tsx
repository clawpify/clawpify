function brandToDomain(brand: string): string {
  const s = brand.trim().toLowerCase();
  if (!s) return "";
  if (s.includes(".")) return s;
  const slug = s.replace(/\s+/g, "").replace(/[^a-z0-9-]/g, "");
  return slug ? `${slug}.com` : s;
}

export function getFaviconUrl(brand: string, size = 32): string {
  const domain = brandToDomain(brand);
  return domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`
    : "";
}

export function BrandFavicon({ brand }: { brand: string }) {
  const domain = brandToDomain(brand);
  const faviconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`
    : "";

  if (!faviconUrl) {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-zinc-200 text-xs font-medium text-zinc-700">
        {brand.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <>
      <img
        src={faviconUrl}
        alt=""
        className="h-5 w-5 shrink-0 rounded object-contain"
        onError={(e) => {
          e.currentTarget.style.display = "none";
          const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
          if (fallback) fallback.style.display = "flex";
        }}
      />
      <span
        className="hidden h-5 w-5 shrink-0 items-center justify-center rounded bg-zinc-200 text-xs font-medium text-zinc-700"
        style={{ display: "none" }}
      >
        {brand.charAt(0).toUpperCase()}
      </span>
    </>
  );
}
