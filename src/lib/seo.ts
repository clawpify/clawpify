const BASE_URL = process.env.BUN_PUBLIC_BASE_URL || "https://clawpify.com";

const DEFAULT_OG_IMAGE = `${BASE_URL}/image/dollars.png`;
const DEFAULT_ORG_LOGO = `${BASE_URL}/apple-touch-icon.png`;

type RouteMeta = {
  title: string;
  description: string;
  ogImage?: string;
};

const ORG_SLOGAN = "Software for consignment shops";

const ORG_KNOWS_ABOUT = [
  "Consignment retail",
  "Resale shop operations",
  "Inventory management",
  "Consignor agreements and payouts",
  "Multi-channel listings",
  "Shopify",
  "WooCommerce",
  "E-commerce API integrations",
];

const defaultMeta: RouteMeta = {
  title: "Clawpify — Software for consignment shops",
  description:
    "Count inventory, track consignor splits, and cross-post listings from one workspace. Connect Shopify, WooCommerce, or custom storefronts. Built for shops navigating AI discovery and agent commerce.",
};

const routeMeta: Record<string, RouteMeta> = {
  "/": defaultMeta,
  "/about": {
    title: "About - Clawpify",
    description:
      "Who we are: consignment shop software for inventory, consignor agreements, and listings — and how we're thinking about Shopify UCP and agentic commerce.",
  },
  "/privacy": {
    title: "Privacy Policy - Clawpify",
    description:
      "How Clawpify collects, uses, and shares personal information when you use our product and website.",
  },
  "/blog": {
    title: "Blog - Clawpify",
    description:
      "Writing on consignment operations, listings, and the shift toward AI-driven commerce.",
  },
};

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function safeJsonLd(schema: object): string {
  return JSON.stringify(schema).replace(/<\/script>/gi, "<\\/script>");
}

function buildJsonLd(pathname: string): string {
  const schemas: object[] = [];

  if (pathname === "/") {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Clawpify",
      url: BASE_URL,
      logo: DEFAULT_ORG_LOGO,
      slogan: ORG_SLOGAN,
      knowsAbout: ORG_KNOWS_ABOUT,
      description: defaultMeta.description,
      sameAs: [
        "https://twitter.com/clawpify",
        "https://linkedin.com/company/clawpify",
      ],
    });

    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Clawpify",
      url: BASE_URL,
      description: defaultMeta.description,
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
        description: "Get started free",
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
            text: "Clawpify is built for consignment and resale shops that track floor and online inventory, manage consignor agreements and payouts, and publish listings to multiple sales channels.",
          },
        },
        {
          "@type": "Question",
          name: "Can I try Clawpify for free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. You can explore the workspace and connect your store before choosing a paid plan.",
          },
        },
        {
          "@type": "Question",
          name: "Can I use Clawpify with my team?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Organization workspaces let your team collaborate on inventory, listings, and day-to-day consignment operations together.",
          },
        },
        {
          "@type": "Question",
          name: "How long does it take to set up and start using Clawpify?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Most shops are up and running in under 10 minutes: connect Shopify, WooCommerce, or your custom storefront, then start adding inventory and listings.",
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
            text: "Clawpify fits next to your storefront and sales channels. Connect your platform to sync products, then draft and cross-post listings without replacing your whole stack.",
          },
        },
      ],
    });
  }

  if (pathname === "/blog") {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Clawpify Blog",
      description: routeMeta["/blog"]!.description,
      url: `${BASE_URL}/blog`,
      publisher: {
        "@type": "Organization",
        name: "Clawpify",
        url: BASE_URL,
      },
    });
  }

  if (schemas.length === 0) return "";
  return schemas
    .map((s) => `<script type="application/ld+json">${safeJsonLd(s)}</script>`)
    .join("\n    ");
}

function buildSeoBlock(pathname: string): string {
  const meta = routeMeta[pathname] ?? defaultMeta;
  const canonical = pathname === "/" ? BASE_URL : `${BASE_URL}${pathname}`;
  const ogImage = meta.ogImage ?? DEFAULT_OG_IMAGE;
  const jsonLd = buildJsonLd(pathname);

  return `<title>${escapeAttr(meta.title)}</title>
    <meta name="description" content="${escapeAttr(meta.description)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:site_name" content="Clawpify" />
    <meta property="og:title" content="${escapeAttr(meta.title)}" />
    <meta property="og:description" content="${escapeAttr(meta.description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:width" content="2715" />
    <meta property="og:image:height" content="2479" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:alt" content="${escapeAttr(meta.title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@clawpify" />
    <meta name="twitter:title" content="${escapeAttr(meta.title)}" />
    <meta name="twitter:description" content="${escapeAttr(meta.description)}" />
    <meta name="twitter:image" content="${ogImage}" />${jsonLd ? "\n    " + jsonLd : ""}`;
}

const SEO_MARKER_RE = /<!-- SEO:START -->[\s\S]*?<!-- SEO:END -->/;

/**
 * Inject per-route SEO tags into the HTML template between the SEO markers.
 *
 * @param html - Raw HTML string containing `<!-- SEO:START -->` and `<!-- SEO:END -->` markers.
 * @param pathname - URL pathname of the current route (e.g. `/`).
 * @returns HTML string with the SEO block replaced.
 */
export function injectSeoMeta(html: string, pathname: string): string {
  const seoBlock = buildSeoBlock(pathname);
  return html.replace(
    SEO_MARKER_RE,
    `<!-- SEO:START -->\n    ${seoBlock}\n    <!-- SEO:END -->`,
  );
}

/**
 * Generate the contents of `robots.txt` for the public site.
 *
 * @returns Plain-text robots.txt string.
 */
export function generateRobotsTxt(): string {
  return `User-agent: *
Allow: /
Disallow: /app/
Disallow: /sign-in
Disallow: /sign-up

# ${BASE_URL}/llms.txt

Sitemap: ${BASE_URL}/sitemap.xml`;
}

export function generateLlmsTxt(): string {
  return `# Clawpify

> ${ORG_SLOGAN}

## Summary

Clawpify is consignment and resale **operations software**: inventory across floor, online, and sold states; consignor agreements and payout splits; and drafting with cross-posting of listings to multiple sales channels. It is **not** a Shopify-only "shopping agent" or narrow prompt-optimization widget—think back-office consignment workflows first, with storefront connections as part of the stack.

## Integrations

- Shopify
- WooCommerce
- Custom storefronts via API

## Key URLs

- ${BASE_URL}/ — Home
- ${BASE_URL}/about — About
- ${BASE_URL}/blog — Blog / Writing
- ${BASE_URL}/privacy — Privacy policy

## Contact and social

- Email: hello@clawpify.com
- GitHub: https://github.com/clawpify
- Discord: https://discord.gg/Pqr6rk5HNg
- X (Twitter): https://twitter.com/clawpify
`;
}

/**
 * Generate the contents of `sitemap.xml` for all public routes.
 *
 * @returns XML sitemap string conforming to the sitemaps.org 0.9 schema.
 */
export function generateSitemapXml(): string {
  const publicPaths: { path: string; lastmod: string; changefreq: string; priority: string }[] = [
    { path: "/",                lastmod: "2026-03-15", changefreq: "monthly", priority: "1.0" },
    { path: "/about",           lastmod: "2026-03-10", changefreq: "monthly", priority: "0.8" },
    { path: "/privacy",         lastmod: "2026-04-01", changefreq: "yearly",  priority: "0.5" },
    { path: "/blog",            lastmod: "2026-03-10", changefreq: "weekly",  priority: "0.7" },
  ];

  const entries = publicPaths
    .map(({ path, lastmod, changefreq, priority }) => {
      const loc = path === "/" ? BASE_URL : `${BASE_URL}${path}`;
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
}
