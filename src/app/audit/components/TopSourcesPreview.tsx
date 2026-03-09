function domainFromUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

type Props = { urls: string[]; max?: number };

export function TopSourcesPreview({ urls, max = 3 }: Props) {
  const top = urls.slice(0, max);

  if (top.length === 0) {
    return <span className="text-sm text-zinc-400">—</span>;
  }

  return (
    <div className="flex items-center gap-0.5">
      {top.map((url) => {
        const domain = domainFromUrl(url);
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
        const letter = domain.charAt(0).toUpperCase();

        return (
          <span key={url} className="relative flex h-4 w-4 shrink-0" title={domain}>
            <img
              src={faviconUrl}
              alt=""
              className="h-4 w-4 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                if (fallback) fallback.style.display = "flex";
              }}
            />
            <span
              className="absolute inset-0 flex hidden items-center justify-center text-xs font-medium text-zinc-500"
              style={{ display: "none" }}
            >
              {letter}
            </span>
          </span>
        );
      })}
    </div>
  );
}
