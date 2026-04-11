import tailwindPlugin from "bun-plugin-tailwind";
import {
  BUN_PUBLIC_API_BASE,
  BUN_PUBLIC_BASE_URL,
  BUN_PUBLIC_CLERK_PUBLISHABLE_KEY,
  BUN_PUBLIC_RUST_API_URL,
  isProduction,
  NODE_ENV,
  RUST_API_URL,
} from "../lib/env";

export async function loadBundledFrontend(entryHtmlPath: string): Promise<{
  builtAssets: Map<string, Blob>;
  rawHtml: string;
}> {
  const clientDefines: Record<string, string> = {
    "process.env.NODE_ENV": JSON.stringify(NODE_ENV),
    "process.env.PORT": JSON.stringify(process.env.PORT ?? ""),
    "process.env.RUST_API_URL": JSON.stringify(RUST_API_URL),
    "process.env.BUN_PUBLIC_RUST_API_URL": JSON.stringify(BUN_PUBLIC_RUST_API_URL),
    "process.env.BUN_PUBLIC_API_BASE": JSON.stringify(BUN_PUBLIC_API_BASE),
    "process.env.BUN_PUBLIC_BASE_URL": JSON.stringify(BUN_PUBLIC_BASE_URL),
    "process.env.BUN_PUBLIC_CLERK_PUBLISHABLE_KEY": JSON.stringify(BUN_PUBLIC_CLERK_PUBLISHABLE_KEY),
    "process.env.CLERK_SECRET_KEY": JSON.stringify(""),
    "process.env.RUST_PROXY_TIMEOUT_MS": JSON.stringify(process.env.RUST_PROXY_TIMEOUT_MS ?? ""),
    "process.env.CORS_ALLOWED_ORIGINS": JSON.stringify(process.env.CORS_ALLOWED_ORIGINS ?? ""),
    "process.env.BUN_SERVICE_URL": JSON.stringify(process.env.BUN_SERVICE_URL ?? ""),
  };

  const frontendBuild = await Bun.build({
    entrypoints: [entryHtmlPath],
    target: "browser",
    sourcemap: "none",
    minify: isProduction,
    define: clientDefines,
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
