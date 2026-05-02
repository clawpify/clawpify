import { BUN_PUBLIC_BASE_URL } from "./constants";
import { posts } from "../app/writing/utils/posts";

const BASE_URL = BUN_PUBLIC_BASE_URL || "https://clawpify.com";

const DEFAULT_OG_IMAGE = `${BASE_URL}/image/dollars-og.jpg`;
const DEFAULT_ORG_LOGO = `${BASE_URL}/apple-touch-icon.png`;

type RouteMeta = {
  title: string;
  description: string;
  ogImage?: string;
  ogType?: "website" | "article";
};

const ORG_SLOGAN = "Software for consignment shops";

const ORG_KNOWS_ABOUT = [
  "Consignment retail",
  "Resale shop operations",
  "Inventory management",
  "Consignor agreements and payouts",
  "Multi-channel listings",
  "Shopify",
  "E-commerce API integrations",
];

const defaultMeta: RouteMeta = {
  title: "Clawpify — Software for consignment shops",
  description:
    "Count inventory, track consignor splits, and cross-post listings from one workspace. Connect Shopify, WooCommerce, or custom storefronts.",
};

const routeMeta: Record<string, RouteMeta> = {
  "/": defaultMeta,
  "/about": {
    title: "About - Clawpify",
    description:
      "Consignment and resale shop software for inventory, consignor agreements, and multi-channel listings. Background on how we think about evolving storefront and checkout protocols.",
  },
  "/privacy": {
    title: "Privacy Policy - Clawpify",
    description:
      "How Clawpify collects, uses, and shares personal information when you use our product and website.",
  },
  "/blog": {
    title: "Writing - Clawpify",
    description:
      "Notes on consignment and resale operations, listings, channels, and how product discovery is changing for merchants.",
  },
  "/consignment-management-software": {
    title: "Consignment Management Software - Clawpify",
    description:
      "Manage consignment inventory, consignor terms, payout context, and online listings from one resale shop workspace.",
  },
  "/consignment-store-pos-software": {
    title: "Consignment Store POS Software Guide - Clawpify",
    description:
      "Compare consignment POS needs with the inventory, consignor, payout, and listing workflows resale shops run every day.",
  },
  "/ebay-consignment-software": {
    title: "eBay Consignment Software - Clawpify",
    description:
      "Prepare eBay listing workflows while tracking consignment inventory, item ownership, seller terms, and payout readiness.",
  },
  "/consignment-tracking-software": {
    title: "Consignment Tracking Software - Clawpify",
    description:
      "Track consignment item status from intake to listing, sale, return, and payout with seller context attached.",
  },
  "/consignment-accounting-software": {
    title: "Consignment Accounting Software Guide - Clawpify",
    description:
      "Track the item ownership, commission splits, fees, and payout context consignment accounting reports depend on.",
  },
  "/best-consignment-shop-software-reviews": {
    title: "Best Consignment Shop Software Reviews - Clawpify",
    description:
      "Compare consignment shop software by inventory, POS fit, seller payouts, online listings, support, and workflow needs.",
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

const seoPageFaqs: Record<string, Array<{ question: string; answer: string }>> = {
  "/consignment-management-software": [
    {
      question: "What is consignment management software?",
      answer:
        "Consignment management software helps resale shops track items, consignors, commission splits, listings, sales status, and payout workflows in one system.",
    },
    {
      question: "Is Clawpify only for online consignment?",
      answer:
        "No. Clawpify is designed around consignment operations that may span in-store inventory, online listings, and connected storefronts.",
    },
  ],
  "/consignment-store-pos-software": [
    {
      question: "Is Clawpify a POS system?",
      answer:
        "Clawpify is consignment operations software for inventory, consignor terms, listings, and payout context. Use a checkout tool if you need payment capture.",
    },
    {
      question: "What should a consignment store POS track?",
      answer:
        "It should track sales plus item ownership, commission splits, fees, inventory status, and payout reporting.",
    },
  ],
  "/ebay-consignment-software": [
    {
      question: "What is eBay consignment software?",
      answer:
        "It helps consignment sellers manage item intake, consignor ownership, eBay listing details, sale status, and payout workflows.",
    },
    {
      question: "Why not list directly in eBay only?",
      answer:
        "Consignment shops also need consignor terms, splits, inventory state, and payout reporting outside the marketplace listing itself.",
    },
  ],
  "/consignment-tracking-software": [
    {
      question: "What should consignment tracking software track?",
      answer:
        "It should track item owner, agreement terms, price, status, listing channel, sale state, and payout readiness.",
    },
    {
      question: "Is tracking different from accounting?",
      answer:
        "Yes. Tracking follows item status and ownership. Accounting focuses on money movement, reports, and reconciliation.",
    },
  ],
  "/consignment-accounting-software": [
    {
      question: "What is consignment accounting software?",
      answer:
        "It helps consignment shops calculate and report seller payouts, commission splits, fees, and sale-related financial records.",
    },
    {
      question: "Does Clawpify replace QuickBooks?",
      answer:
        "No. Clawpify focuses on consignment operations and payout context. Shops can use accounting software for final bookkeeping.",
    },
  ],
  "/best-consignment-shop-software-reviews": [
    {
      question: "What is the best consignment shop software?",
      answer:
        "The best choice depends on whether your shop needs POS checkout, inventory tracking, online listings, consignor payouts, or multi-channel selling.",
    },
    {
      question: "Should I choose the cheapest consignment software?",
      answer:
        "Only if it still covers your core workflow. Cheap software can become expensive if staff must maintain spreadsheets for payouts, listings, and item status.",
    },
  ],
};

const seoPageLabels: Record<string, string> = {
  "/consignment-management-software": "Consignment Management Software",
  "/consignment-store-pos-software": "Consignment Store POS Software",
  "/ebay-consignment-software": "eBay Consignment Software",
  "/consignment-tracking-software": "Consignment Tracking Software",
  "/consignment-accounting-software": "Consignment Accounting Software",
  "/best-consignment-shop-software-reviews": "Best Consignment Shop Software Reviews",
};

function blogPostForPath(pathname: string) {
  const slug = pathname.match(/^\/blog\/([^/]+)$/)?.[1];
  if (!slug) return undefined;
  return posts.find((post) => post.slug === slug);
}

function metaForPath(pathname: string): RouteMeta {
  const post = blogPostForPath(pathname);
  if (post) {
    return {
      title: `${post.title} - Clawpify`,
      description: post.description,
      ogType: "article",
    };
  }

  return routeMeta[pathname] ?? defaultMeta;
}

function breadcrumbSchema(items: Array<{ name: string; path: string }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path === "/" ? BASE_URL : `${BASE_URL}${item.path}`,
    })),
  };
}

function faqSchema(faqs: Array<{ question: string; answer: string }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

function faqFromPostContent(content: string): Array<{ question: string; answer: string }> {
  const faqStart = content.indexOf("## FAQ");
  if (faqStart === -1) return [];

  const faqContent = content.slice(faqStart + "## FAQ".length);
  const matches = Array.from(
    faqContent.matchAll(/^##\s+(.+)\n\n([\s\S]*?)(?=\n##\s+|\s*$)/gm),
    (match) => ({
      question: match[1]!.trim(),
      answer: match[2]!.trim().replace(/\n+/g, " "),
    }),
  );

  return matches.slice(0, 6);
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
      name: "Clawpify Writing",
      description: routeMeta["/blog"]!.description,
      url: `${BASE_URL}/blog`,
      publisher: {
        "@type": "Organization",
        name: "Clawpify",
        url: BASE_URL,
      },
    });
  }

  const pageLabel = seoPageLabels[pathname];
  if (pageLabel) {
    const meta = metaForPath(pathname);
    schemas.push({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Clawpify",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: meta.description,
      url: `${BASE_URL}${pathname}`,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Get started free",
      },
      provider: {
        "@type": "Organization",
        name: "Clawpify",
        url: BASE_URL,
      },
    });

    schemas.push(breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: pageLabel, path: pathname },
    ]));

    const faqs = seoPageFaqs[pathname];
    if (faqs) schemas.push(faqSchema(faqs));
  }

  const post = blogPostForPath(pathname);
  if (post) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.date,
      author: {
        "@type": "Person",
        name: post.author,
      },
      publisher: {
        "@type": "Organization",
        name: "Clawpify",
        url: BASE_URL,
        logo: {
          "@type": "ImageObject",
          url: DEFAULT_ORG_LOGO,
        },
      },
      mainEntityOfPage: `${BASE_URL}/blog/${post.slug}`,
    });

    schemas.push(breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Writing", path: "/blog" },
      { name: post.title, path: `/blog/${post.slug}` },
    ]));

    const postFaqs = faqFromPostContent(post.content);
    if (postFaqs.length > 0) schemas.push(faqSchema(postFaqs));
  }

  if (schemas.length === 0) return "";
  return schemas
    .map((s) => `<script type="application/ld+json">${safeJsonLd(s)}</script>`)
    .join("\n    ");
}

function buildSeoBlock(pathname: string): string {
  const meta = metaForPath(pathname);
  const canonical = pathname === "/" ? BASE_URL : `${BASE_URL}${pathname}`;
  const ogImage = meta.ogImage ?? DEFAULT_OG_IMAGE;
  const ogType = meta.ogType ?? "website";
  const jsonLd = buildJsonLd(pathname);

  return `<title>${escapeAttr(meta.title)}</title>
    <meta name="description" content="${escapeAttr(meta.description)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:site_name" content="Clawpify" />
    <meta property="og:title" content="${escapeAttr(meta.title)}" />
    <meta property="og:description" content="${escapeAttr(meta.description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="1096" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:alt" content="${escapeAttr(meta.title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@clawpify" />
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

# ${BASE_URL}/llms.txt

Sitemap: ${BASE_URL}/sitemap.xml`;
}

export function generateLlmsTxt(): string {
  return `# Clawpify

> ${ORG_SLOGAN}

## Summary

Clawpify is consignment and resale **operations software**: inventory across floor, online, and sold states; consignor agreements and payout splits; and drafting with cross-posting of listings to multiple sales channels. It is **not** a dedicated "AI shopping SEO" or prompt-conversion tool, and not a Shopify-only shopping-agent toy—think back-office consignment workflows first, with storefront connections as part of the stack.

## Integrations

- Shopify
- WooCommerce
- Custom storefronts via API

## Key URLs

- ${BASE_URL}/ — Home
- ${BASE_URL}/consignment-management-software — Consignment management software
- ${BASE_URL}/consignment-store-pos-software — Consignment store POS software
- ${BASE_URL}/ebay-consignment-software — eBay consignment software
- ${BASE_URL}/consignment-tracking-software — Consignment tracking software
- ${BASE_URL}/consignment-accounting-software — Consignment accounting software
- ${BASE_URL}/best-consignment-shop-software-reviews — Consignment software comparison guide
- ${BASE_URL}/about — About
- ${BASE_URL}/blog — Writing
- ${BASE_URL}/privacy — Privacy policy

## Contact and social

- Email: hello@clawpify.com
- GitHub: https://github.com/clawpify
- Discord: https://discord.gg/Pqr6rk5HNg
- X (Twitter): https://twitter.com/clawpify
`;
}

export function generateSitemapXml(): string {
  const publicPaths: { path: string; lastmod: string; changefreq: string; priority: string }[] = [
    { path: "/",                                      lastmod: "2026-05-01", changefreq: "monthly", priority: "1.0" },
    { path: "/consignment-management-software",       lastmod: "2026-05-01", changefreq: "monthly", priority: "0.9" },
    { path: "/consignment-store-pos-software",        lastmod: "2026-05-01", changefreq: "monthly", priority: "0.85" },
    { path: "/ebay-consignment-software",             lastmod: "2026-05-01", changefreq: "monthly", priority: "0.85" },
    { path: "/consignment-tracking-software",         lastmod: "2026-05-01", changefreq: "monthly", priority: "0.8" },
    { path: "/consignment-accounting-software",       lastmod: "2026-05-01", changefreq: "monthly", priority: "0.8" },
    { path: "/best-consignment-shop-software-reviews", lastmod: "2026-05-01", changefreq: "monthly", priority: "0.8" },
    { path: "/about",                                 lastmod: "2026-03-10", changefreq: "monthly", priority: "0.8" },
    { path: "/privacy",                               lastmod: "2026-04-01", changefreq: "yearly",  priority: "0.5" },
    { path: "/blog",                                  lastmod: "2026-05-01", changefreq: "weekly",  priority: "0.7" },
    ...posts.map((post) => ({
      path: `/blog/${post.slug}`,
      lastmod: "2026-05-01",
      changefreq: "monthly",
      priority: "0.65",
    })),
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
