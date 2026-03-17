export const copy = {
  intro: {
    heading: "Own how AI sells your products",
    paragraph:
      "Optimize product data, reveal which prompts convert, and earn more from AI-driven purchases.",
    ctaLabel: "GET STARTED",
    ctaHref: "#",
  },
  hero: {
    headline: "Bring product discovery into the AI economy",
    rotatingWords: ["Commerce", "B2B", "SaaS", "E-commerce", "Agents"],
    subline:
      "Audits that reveal which prompts convert. Optimization methods that make agents buy.",
    ctaPrimary: "Book a call",
    ctaSecondary: "Explore docs",
    heroDemo: {
      exploreLabel: "TRY IT OUT OR SCROLL DOWN",
      aiAgents: [
        { id: "openai", label: "OpenAI", productIds: [0, 1, 2], response: "Great question! Here are some of the best gift ideas for your mom. I've selected a mix of self-care, handmade, and gourmet options that are highly rated across multiple stores." },
        { id: "perplexity", label: "Perplexity", productIds: [0, 3, 5], response: "Based on reviews from 12 sources, these are the top-rated gifts for mothers in 2026. A premium skincare set, a relaxing lavender bath collection, and a curated matcha sampler — all with 4.5+ star ratings." },
        { id: "claude", label: "Claude", productIds: [0, 1, 2], response: "I'd love to help you find something special. Here are a few thoughtful options — a skincare set for relaxation, a handcrafted bracelet, and an organic tea sampler she can enjoy daily." },
        { id: "meta", label: "Llama", productIds: [1, 3, 5], response: "Here are the top trending gifts for moms right now. A handmade bracelet, a soothing lavender bath set, and a matcha collection — all popular picks with excellent customer feedback." },
        { id: "grok", label: "Grok", productIds: [2, 4, 3], response: "Yo, birthday gift for mom? I gotchu. Scraped the entire internet in like 0.2 seconds. Organic tea, a handwoven band, and a lavender bath set — trust me, she's gonna cry (the good kind)." },
        { id: "gemini", label: "Gemini", productIds: [0, 4, 5], response: "Looking at the latest reviews and trending products, a Nordic skincare set, a woven friendship band, and a matcha gift collection stand out as excellent choices. Each one is thoughtful and highly rated." },
      ],
      query: "best birthday gifts for mom?",
      emptyMessage: "Your products not found in this AI's results.",
      products: [
        { name: "Nordic Skincare Set", price: "$48", store: "GlowCo", image: "/image/product-skincare.png" },
        { name: "Handcrafted Leather Bracelet", price: "$62", store: "Artisan Goods", image: "/image/product-bracelet.png" },
        { name: "Organic Tea Sampler Box", price: "$34", store: "Tea House", image: "/image/product-tea.png" },
        { name: "Lavender Bath Set", price: "$39", store: "GlowCo", image: "/image/product-skincare.png" },
        { name: "Woven Friendship Band", price: "$28", store: "Artisan Goods", image: "/image/product-bracelet.png" },
        { name: "Matcha Gift Collection", price: "$42", store: "Tea House", image: "/image/product-tea.png" },
      ],
    },
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
    {
      label: "COMMERCE",
      title: "Your products, found by AI",
      description: "Make your store AI-ready so agents actually find and recommend what you sell.",
    },
    {
      label: "ANALYTICS",
      title: "See how agents see you",
      description: "Know which agents recommend you, how often, and where competitors are winning.",
    },
    {
      label: "BRAND ALIGNMENT",
      title: "Make sure AI aligns with your brand",
      description: "Keep your brand story straight across every AI that talks about you.",
    },
  ],
  introAiSearch: {
    panelLabel: "Insights",
    heading: "Turn AI searches into actionable insights",
    paragraph:
      "Run a prompt across AI search, see how models and competitors respond, and turn every result into clear actions for your team.",
  },
  featuresAiSearch: [
    {
      label: "PROMPT ANALYSIS",
      title: "Run one prompt across AI search",
      description: "See how major models answer the same query and where your brand actually appears.",
    },
    {
      label: "COMPETITOR INTEL",
      title: "Spot who wins the recommendation",
      description: "Compare which competitors are cited, what they are praised for, and where you are missing.",
    },
    {
      label: "ACTIONABLE INSIGHTS",
      title: "Get fixes your team can act on",
      description: "Turn AI results into concrete content, schema, and merchandising updates that improve visibility.",
    },
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
    button: "Book a call",
  },
  faq: {
    sectionLabel: "FAQ",
    heading: "Your questions, answered",
    description:
      "We're here to help. Reach out to our sales team for guidance on how to integrate Clawpify into your commerce workflow.",
    ctaLabel: "BOOK A DEMO",
    items: [
      {
        question: "Who can use Clawpify?",
        answer:
          "Clawpify is built for e-commerce brands and agencies. If you sell products online and want AI agents to recommend them, Clawpify is a fit for you. We work with companies ranging from Shopify solo stores to enterprise retailers.",
      },
      {
        question: "Can I try Clawpify for free?",
        answer:
          "Yes. We offer a free audit so you can see how your products perform across AI agents before committing to a plan.",
      },
      {
        question: "Can I use Clawpify with my team?",
        answer:
          "Absolutely. Clawpify supports team workspaces so multiple people can collaborate on audits, view reports, and apply optimizations together.",
      },
      {
        question: "How long does it take to set up and start using Clawpify?",
        answer:
          "Most stores are up and running in under 10 minutes. Connect your platform, run the audit, and start optimizing right away.",
      },
      {
        question: "Does Clawpify support multiple e-commerce platforms?",
        answer:
          "Yes. We currently support Shopify, WooCommerce, and custom storefronts via our API, with more integrations on the way.",
      },
      {
        question: "Will it integrate with my existing tools?",
        answer:
          "Clawpify is designed to fit into your current stack. We offer integrations with popular analytics, CMS, and marketing platforms.",
      },
    ],
  },
  footer: {
    navColumns: [
      { heading: "Product", links: [{ label: "Pricing", href: "#" }] },
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
        links: [{ label: "GitHub", href: "https://github.com/clawpify" }],
      },
      {
        heading: "Legal",
        links: [{ label: "Privacy Policy", href: "#" }],
      },
      {
        heading: "Connect",
        links: [
          { label: "Book a demo", href: "https://calendar.notion.so/meet/alhwyn/clawpify" },
          { label: "Discord", href: "https://discord.gg/a2tRAjWV" },
        ],
      },
    ],
    copyright: "© 2026 Clawpify",
  },
} as const;
