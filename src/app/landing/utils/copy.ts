export const copy = {
  intro: {
    heading: "Find what agents want to buy",
    paragraph:
      "Optimize product data, reveal which prompts convert, and earn more from AI-driven purchases.",
  },
  hero: {
    headline: "Bring discovery into the Agent economy",
    rotatingWords: ["Commerce", "B2B", "SaaS", "E-commerce", "Agents"],
    subline:
      "Audits that reveal which prompts convert. Optimization methods that make agents buy.",
    ctaPrimary: "Get started free",
    ctaSecondary: "Explore docs",
  },
  stats: {
    stores: "500+",
    storesLabel: "Stores optimized",
    lift: "40%",
    liftLabel: "Conversion lift",
    platforms: "3+",
    platformsLabel: "Platforms supported",
  },
  painPoints: {
    title: "Selling to agents is hard",
    items: [
      "Building agent-friendly product data",
      "Optimizing prompts that drive purchases",
      "Scaling across Shopify, WooCommerce, and more",
    ],
    solution: "Clawpify erases that drag in one audit.",
  },
  features: [
    { title: "Commerce" },
    { title: "B2B" },
    { title: "A2A" },
  ],
  introAiSearch: {
    heading: "See what AI thinks about your brand",
    paragraph:
      "See what a council of AI models thinks about your prompt within AI search—and how you stack up against competitors.",
  },
  featuresAiSearch: [
    { title: "AI Search" },
    { title: "Competitors" },
    { title: "Prompts" },
  ],
  howItWorks: {
    title: "How it works",
    steps: [
      { number: 1, title: "Connect your store", desc: "Link Shopify, WooCommerce, or other platforms in minutes." },
      { number: 2, title: "Run the audit", desc: "We analyze your product data and AI prompt performance." },
      { number: 3, title: "Apply optimizations", desc: "Get actionable recommendations to convert more agents." },
    ],
  },
  testimonials: [
    {
      quote:
        "Clawpify's audit revealed exactly which prompts were driving our agent conversions. We doubled our AI-driven sales in a month.",
      author: "Sarah Chen",
      role: "Head of E-commerce",
      company: "TechGear Co",
    },
    {
      quote:
        "Finally, a tool that understands how agents shop. The optimization methods are clear and actionable.",
      author: "Marcus Webb",
      role: "Founder",
      company: "AgentFirst Store",
    },
  ],
  cta: {
    title: "Ready to sell to agents faster?",
    subline: "Join stores already optimizing for AI-driven purchases.",
    button: "Get started free",
  },
  footer: {
    navColumns: [
      { heading: "Product", links: [{ label: "Pricing", href: "#" }] },
      {
        heading: "Company",
        links: [
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Writing", href: "#" },
        ],
      },
      {
        heading: "Legal",
        links: [{ label: "Privacy Policy", href: "#" }],
      },
      {
        heading: "Connect",
        links: [{ label: "Book a demo", href: "#" }],
      },
    ],
    copyright: "© 2026 Clawpify",
  },
} as const;
