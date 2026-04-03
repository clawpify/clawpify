import tailwindPlugin from "bun-plugin-tailwind";

export async function loadBundledFrontend(entryHtmlPath: string): Promise<{
  builtAssets: Map<string, Blob>;
  rawHtml: string;
}> {
  const clientDefines: Record<string, string> = {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "development"),
  };
  for (const [key, value] of Object.entries(process.env)) {
    if ((key.startsWith("BUN_PUBLIC_") || key.startsWith("VITE_")) && value != null) {
      clientDefines[`process.env.${key}`] = JSON.stringify(value);
    }
  }

  const frontendBuild = await Bun.build({
    entrypoints: [entryHtmlPath],
    target: "browser",
    sourcemap: "none",
    minify: process.env.NODE_ENV === "production",
    define: clientDefines,
    plugins: [tailwindPlugin],
  });

  if (!frontendBuild.success) {
    throw new Error("Failed to build frontend bundle from index.html");
  }

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

  if (!htmlTemplate) {
    throw new Error("Missing built HTML output");
  }

  const rawHtml = htmlTemplate
    .replaceAll('href="./', 'href="/')
    .replaceAll('src="./', 'src="/');

  if (mainBundle) {
    builtAssets.set("/frontend.tsx", mainBundle);
  }

  return { builtAssets, rawHtml };
}
