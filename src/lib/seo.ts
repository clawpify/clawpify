const BASE_URL = process.env.BUN_PUBLIC_BASE_URL || "https://clawpify.com";

type RouteMeta = {
  title: string;
  description: string;
  ogImage?: string;
};

const defaultMeta: RouteMeta = {
  title: "Clawpify - Own How AI Sells Your Products",
  description:
    "Optimize product data, reveal which prompts convert, and earn more from AI-driven purchases. Audit your store across ChatGPT, Perplexity, and more.",
};

const routeMeta: Record<string, RouteMeta> = {
  "/": defaultMeta,
  "/about": {
    title: "About - Clawpify",
    description:
      "Learn how Clawpify helps e-commerce brands optimize for AI-driven commerce and get discovered by AI agents.",
  },
  "/audit": {
    title: "Free AI Audit - Clawpify",
    description:
      "Run a free audit to see how your products perform across AI agents like ChatGPT, Perplexity, and Claude.",
  },
  "/audit/web-search": {
    title: "AI Web Search - Clawpify",
    description:
      "See what AI models think about your brand and how you compare to competitors in AI-powered search.",
  },
  "/blog": {
    title: "Blog - Clawpify",
    description:
      "Thoughts on AI commerce, product discovery, and the shift from search to agents.",
  },
};

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildJsonLd(pathname: string): string {
  const schemas: object[] = [];

  if (pathname === "/") {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Clawpify",
      url: BASE_URL,
      logo: `${BASE_URL}/image/clawpify.png`,
      description: defaultMeta.description,
    });

    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Clawpify",
      url: BASE_URL,
    });

    schemas.push({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Clawpify",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: defaultMeta.description,
      url: BASE_URL,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free AI audit",
      },
    });

    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Who can use Clawpify?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Clawpify is built for e-commerce brands and agencies. If you sell products online and want AI agents to recommend them, Clawpify is a fit for you.",
          },
        },
        {
          "@type": "Question",
          name: "Can I try Clawpify for free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. We offer a free audit so you can see how your products perform across AI agents before committing to a plan.",
          },
        },
        {
          "@type": "Question",
          name: "Can I use Clawpify with my team?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Absolutely. Clawpify supports team workspaces so multiple people can collaborate on audits, view reports, and apply optimizations together.",
          },
        },
        {
          "@type": "Question",
          name: "How long does it take to set up and start using Clawpify?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Most stores are up and running in under 10 minutes. Connect your platform, run the audit, and start optimizing right away.",
          },
        },
        {
          "@type": "Question",
          name: "Does Clawpify support multiple e-commerce platforms?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. We currently support Shopify, WooCommerce, and custom storefronts via our API, with more integrations on the way.",
          },
        },
        {
          "@type": "Question",
          name: "Will it integrate with my existing tools?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Clawpify is designed to fit into your current stack. We offer integrations with popular analytics, CMS, and marketing platforms.",
          },
        },
      ],
    });
  }

  if (schemas.length === 0) return "";
  return schemas
    .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join("\n    ");
}

function buildSeoBlock(pathname: string): string {
  const meta = routeMeta[pathname] ?? defaultMeta;
  const canonical = pathname === "/" ? BASE_URL : `${BASE_URL}${pathname}`;
  const ogImage = meta.ogImage ?? `${BASE_URL}/image/clawpify.png`;
  const jsonLd = buildJsonLd(pathname);

  return `<title>${escapeAttr(meta.title)}</title>
    <meta name="description" content="${escapeAttr(meta.description)}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:site_name" content="Clawpify" />
    <meta property="og:title" content="${escapeAttr(meta.title)}" />
    <meta property="og:description" content="${escapeAttr(meta.description)}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:url" content="${canonical}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttr(meta.title)}" />
    <meta name="twitter:description" content="${escapeAttr(meta.description)}" />
    <meta name="twitter:image" content="${ogImage}" />${jsonLd ? "\n    " + jsonLd : ""}`;
}

const SEO_MARKER_RE = /<!-- SEO:START -->[\s\S]*?<!-- SEO:END -->/;

export function injectSeoMeta(html: string, pathname: string): string {
  const seoBlock = buildSeoBlock(pathname);
  return html.replace(
    SEO_MARKER_RE,
    `<!-- SEO:START -->\n    ${seoBlock}\n    <!-- SEO:END -->`,
  );
}

export function generateRobotsTxt(): string {
  return `User-agent: *
Allow: /
Disallow: /app/
Disallow: /sign-in
Disallow: /sign-up
Disallow: /onboarding

Sitemap: ${BASE_URL}/sitemap.xml`;
}

export function generateSitemapXml(): string {
  const publicPaths: { path: string; lastmod: string; priority: string }[] = [
    { path: "/", lastmod: "2026-03-15", priority: "1.0" },
    { path: "/about", lastmod: "2026-03-10", priority: "0.8" },
    { path: "/audit", lastmod: "2026-03-12", priority: "0.9" },
    { path: "/audit/web-search", lastmod: "2026-03-12", priority: "0.8" },
    { path: "/blog", lastmod: "2026-03-10", priority: "0.7" },
  ];

  const entries = publicPaths
    .map(({ path, lastmod, priority }) => {
      const loc = path === "/" ? BASE_URL : `${BASE_URL}${path}`;
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
}
