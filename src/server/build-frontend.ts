import tailwindPlugin from "bun-plugin-tailwind";

/** Clerk Frontend API hosts are not the Clawpify REST API; skip if pasted into API base env by mistake. */
function isClerkAccountsDevOrigin(value: string): boolean {
  try {
    const { hostname } = new URL(value);
    return hostname.endsWith(".clerk.accounts.dev");
  } catch {
    return false;
  }
}

function firstNonClerkApiOrigin(...candidates: (string | undefined)[]): string {
  for (const raw of candidates) {
    const t = (raw ?? "").trim();
    if (!t || isClerkAccountsDevOrigin(t)) continue;
    return t;
  }
  return "";
}

function clientNodeEnv(): string {
  if (process.env.NODE_ENV) return process.env.NODE_ENV;
  return process.env.CLAWPIFY_PROD === "1" ? "production" : "development";
}

export async function loadBundledFrontend(entryHtmlPath: string): Promise<{
  builtAssets: Map<string, Blob>;
  rawHtml: string;
}> {
  const nodeEnv = clientNodeEnv();
  const isProd = nodeEnv === "production";

  const pubApi = process.env.BUN_PUBLIC_API_URL ?? "";
  const clientRustOrigin = firstNonClerkApiOrigin(
    pubApi,
    process.env.BUN_PUBLIC_RUST_API_URL,
    process.env.RUST_API_URL,
  );

  const clientDefines: Record<string, string> = {
    "process.env.NODE_ENV": JSON.stringify(nodeEnv),
    "process.env.PORT": JSON.stringify(process.env.PORT ?? ""),
    "process.env.RUST_API_URL": JSON.stringify(clientRustOrigin),
    "process.env.BUN_PUBLIC_API_URL": JSON.stringify(process.env.BUN_PUBLIC_API_URL ?? ""),
    "process.env.BUN_PUBLIC_BASE_URL": JSON.stringify(process.env.BUN_PUBLIC_BASE_URL ?? ""),
    "process.env.BUN_PUBLIC_CLERK_PUBLISHABLE_KEY": JSON.stringify(
      process.env.BUN_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
    ),
    "process.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(
      process.env.VITE_CLERK_PUBLISHABLE_KEY ?? "",
    ),
    "process.env.CLAWPIFY_PROD": JSON.stringify(process.env.CLAWPIFY_PROD ?? ""),
    "process.env.CLERK_SECRET_KEY": JSON.stringify(""),
    "process.env.RUST_PROXY_TIMEOUT_MS": JSON.stringify(process.env.RUST_PROXY_TIMEOUT_MS ?? ""),
  };

  const frontendBuild = await Bun.build({
    entrypoints: [entryHtmlPath],
    target: "browser",
    sourcemap: "none",
    minify: isProd,
    define: clientDefines,
    banner: `var process=globalThis.process??{env:{NODE_ENV:${JSON.stringify(nodeEnv)}}};`,
    plugins: [tailwindPlugin],
  });

  if (!frontendBuild.success) throw new Error("Failed to build frontend bundle from index.html");

  const builtAssets = new Map<string, Blob>();
  let mainBundle: Blob | null = null;
  let htmlTemplate = "";
  for (const output of frontendBuild.outputs) {
    const fileName = output.path.split("/").pop();
    if (!fileName) continue;
    if (fileName.endsWith(".html")) {
      htmlTemplate = await output.text();
      continue;
    }
    if (!mainBundle && fileName.endsWith(".js")) mainBundle = output;
    builtAssets.set(`/${fileName}`, output);
  }

  if (!htmlTemplate) throw new Error("Missing built HTML output");

  const rawHtml = htmlTemplate
    .replaceAll('href="./', 'href="/')
    .replaceAll('src="./', 'src="/');

  if (mainBundle) builtAssets.set("/frontend.tsx", mainBundle);

  return { builtAssets, rawHtml };
}
