export const landingCopy = {
  nav: {
    ctaLabel: "Open app",
    signedInCtaLabel: "Open app",
    links: [
      { label: "Features", href: "/#features" },
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
    },
    {
      title: "Consignor agreements",
      description: "Terms and payouts stay on each item.",
      ctaLabel: "Agreements",
    },
    {
      title: "Cross-post listings",
      description: "Draft once, push to your channels.",
      ctaLabel: "Listings",
    },
  ],
  footer: {
    wordmark: "Clawpify",
    tagline: "Software for consignment shops",
    copyright: "© 2026",
    navColumns: [
      {
        heading: "Product",
        links: [{ label: "Pricing", href: "/#features" }],
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
          href: "https://chat.openai.com/?q=tell+me+about+clawpify.com",
          ariaLabel: "ChatGPT",
        },
        {
          key: "perplexity",
          href: "https://www.perplexity.ai/search?q=what+is+clawpify.com",
          ariaLabel: "Perplexity",
        },
        {
          key: "claude",
          href: "https://claude.ai/new?q=tell+me+about+clawpify.com",
          ariaLabel: "Claude",
        },
        {
          key: "gemini",
          href: "https://gemini.google.com/app?q=tell+me+about+clawpify.com",
          ariaLabel: "Gemini",
        },
        {
          key: "grok",
          href: "https://grok.x.ai/?q=tell+me+about+clawpify.com",
          ariaLabel: "Grok",
        },
      ],
    },
  },
} as const;
