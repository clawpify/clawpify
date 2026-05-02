export const landingCopy = {
  nav: {
    ctaLabel: "Sign in",
    signedInCtaLabel: "Sign in",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Software", href: "/consignment-management-software" },
      { label: "About", href: "/about" },
      { label: "Writing", href: "/blog" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
  hero: {
    headline: "Software for consignment shops",
    subline: "Count inventory, track splits, post listings.",
    ctaLabel: "Sign in",
  },
  heroWaitlist: {
    emailLabel: "Email address",
    placeholder: "you@example.com",
    submitLabel: "Join waitlist",
    submittingLabel: "Joining…",
    successMessage: "You're on the list. We'll be in touch.",
    signInPrompt: "Already have an account? Sign in",
  },
  featuresIntro: {
    headline: "In your workspace",
  },
  features: [
    {
      title: "Track inventory",
      description: "Floor stock, online, and sold.",
      ctaLabel: "Inventory",
      ctaHref: "/consignment-tracking-software",
      visual: "inventoryBubbles" as const,
    },
    {
      title: "Consignor agreements",
      description: "Terms and payouts stay on each item.",
      ctaLabel: "Agreements",
      ctaHref: "/consignment-accounting-software",
      visual: "moneyMotif" as const,
    },
    {
      title: "Cross-post listings",
      description: "Draft once, push to your channels.",
      ctaLabel: "Listings",
      ctaHref: "/ebay-consignment-software",
      visual: "channelLogos" as const,
    },
  ],
  footer: {
    wordmark: "Clawpify",
    tagline: "Software for consignment shops",
    copyright: "© 2026",
    navColumns: [
      {
        heading: "Product",
        links: [
          { label: "Software", href: "/consignment-management-software" },
          { label: "POS guide", href: "/consignment-store-pos-software" },
          { label: "eBay", href: "/ebay-consignment-software" },
        ],
      },
      {
        heading: "Resources",
        links: [
          { label: "Tracking", href: "/consignment-tracking-software" },
          { label: "Accounting", href: "/consignment-accounting-software" },
          { label: "Reviews", href: "/best-consignment-shop-software-reviews" },
        ],
      },
      {
        heading: "Company",
        links: [
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Writing", href: "/blog" },
        ],
      },
      {
        heading: "Developer",
        links: [{ label: "GitHub", href: "https://github.com/clawpify", external: true }],
      },
      {
        heading: "Legal",
        links: [{ label: "Privacy", href: "/privacy" }],
      },
      {
        heading: "Connect",
        links: [
          { label: "Email", href: "mailto:hello@clawpify.com" },
          { label: "Discord", href: "https://discord.gg/Pqr6rk5HNg", external: true },
        ],
      },
    ],
    exploreWithAi: {
      label: "Explore with AI",
      providers: [
        {
          key: "openai",
          href: "https://chat.openai.com/?q=What+is+Clawpify%3F+Consignment+and+resale+shop+software+for+inventory%2C+consignors%2C+and+listings.",
          ariaLabel: "ChatGPT",
        },
        {
          key: "perplexity",
          href: "https://www.perplexity.ai/search?q=Clawpify+consignment+resale+shop+software+inventory+listings",
          ariaLabel: "Perplexity",
        },
        {
          key: "claude",
          href: "https://claude.ai/new?q=What+is+Clawpify%3F+Consignment+and+resale+operations+software+for+inventory%2C+consignors%2C+and+listings.",
          ariaLabel: "Claude",
        },
        {
          key: "gemini",
          href: "https://gemini.google.com/app?q=Clawpify+software+for+consignment+shops+inventory+and+listings",
          ariaLabel: "Gemini",
        },
        {
          key: "grok",
          href: "https://grok.x.ai/?q=What+does+Clawpify+do%3F+Consignment+shop+inventory+and+listings",
          ariaLabel: "Grok",
        },
      ],
    },
  },
} as const;
