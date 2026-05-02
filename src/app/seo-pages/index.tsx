import { Link } from "react-router-dom";

type SeoPageContent = {
  eyebrow: string;
  title: string;
  answer: string;
  primaryCta?: string;
  sections: Array<{
    title: string;
    body: string;
    bullets?: string[];
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  related: Array<{
    label: string;
    href: string;
  }>;
};

const backLinkClass =
  "inline-block font-mono text-[0.65rem] font-medium uppercase tracking-widest text-[#8a8378] transition hover:text-[#26251e]";

const pages = {
  management: {
    eyebrow: "Consignment Management Software",
    title: "Consignment management software for inventory, consignors, and listings",
    answer:
      "Clawpify is consignment management software for resale shops that need one place to track inventory, consignor terms, payout splits, and online listings. It helps shops move items from intake to floor, online channels, sold status, and payout workflows without scattering work across spreadsheets.",
    sections: [
      {
        title: "What consignment shops manage in Clawpify",
        body: "A consignment shop needs more than a product list. Each item has an owner, agreement terms, a sales channel plan, and a payout trail. Clawpify keeps those operational details connected to the item record.",
        bullets: [
          "Inventory across floor, online, draft, and sold states.",
          "Consignor agreements, splits, fees, and payout context.",
          "Listing drafts for marketplaces and storefront channels.",
          "Workspace structure for teams running daily resale operations.",
        ],
      },
      {
        title: "Built for resale workflows",
        body: "Traditional retail tools assume the shop owns every item. Consignment software needs to remember who owns the item, what happens when it sells, and how staff should list or reconcile it.",
      },
      {
        title: "How shops use the workflow",
        body: "Start by adding an item, attach consignor and agreement details, prepare listing information, publish or track the sales channel, then use sale status to prepare payout work.",
      },
    ],
    faqs: [
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
      {
        question: "Can Clawpify replace spreadsheets?",
        answer:
          "For inventory, consignor terms, listing prep, and payout context, yes. Shops may still export data to accounting tools when needed.",
      },
    ],
    related: [
      { label: "Consignment tracking software", href: "/consignment-tracking-software" },
      { label: "Consignment accounting software", href: "/consignment-accounting-software" },
      { label: "eBay consignment software", href: "/ebay-consignment-software" },
      { label: "Best consignment shop software reviews", href: "/best-consignment-shop-software-reviews" },
    ],
  },
  pos: {
    eyebrow: "Consignment Store POS Software",
    title: "Consignment store POS software: what shops need beyond checkout",
    answer:
      "Consignment store POS software should do more than ring up sales. A resale shop also needs inventory tracking, consignor ownership, commission splits, payout reporting, and online listing workflows. Clawpify focuses on the operational layer that connects those details before and after checkout.",
    sections: [
      {
        title: "Where POS ends and consignment operations begin",
        body: "A POS records a transaction. Consignment operations answer who owns the item, what agreement applies, where the item is listed, and what payout is owed after sale.",
        bullets: [
          "Track item ownership and consignor terms.",
          "Prepare product records before checkout happens.",
          "Keep online listings aligned with inventory state.",
          "Support payout work after items sell.",
        ],
      },
      {
        title: "For clothing and resale shops",
        body: "Clothing consignment shops handle one-of-one inventory, frequent intake, varied pricing, and seller-specific terms. Clawpify is shaped around those item-level details.",
      },
      {
        title: "How to pair Clawpify with checkout",
        body: "Use Clawpify for intake, listings, consignor context, and inventory state. Pair it with your checkout flow or storefront when you need payment capture.",
      },
    ],
    faqs: [
      {
        question: "Is Clawpify a POS system?",
        answer:
          "Clawpify is consignment operations software. It helps with inventory, consignor terms, listings, and payout context; use a dedicated checkout tool if you need payment capture at the counter.",
      },
      {
        question: "What should a consignment store POS track?",
        answer:
          "It should track sales plus item ownership, commission splits, fees, inventory status, and payout reporting.",
      },
      {
        question: "Does clothing consignment need special software?",
        answer:
          "Usually yes. Clothing resale has high item volume, unique SKUs, varied condition, and consignor-specific terms that generic retail tools often miss.",
      },
    ],
    related: [
      { label: "Consignment management software", href: "/consignment-management-software" },
      { label: "Consignment tracking software", href: "/consignment-tracking-software" },
      { label: "Consignment vendor meaning", href: "/blog/consignment-vendor-meaning" },
    ],
  },
  ebay: {
    eyebrow: "eBay Consignment Software",
    title: "eBay consignment software for listing workflows and resale inventory",
    answer:
      "eBay consignment software helps shops prepare item records, track consignor ownership, manage listing details, and keep sale status connected to payout work. Clawpify is built for consignment and resale teams that need eBay workflows to fit inside broader inventory operations.",
    sections: [
      {
        title: "Why eBay consignment needs item-level tracking",
        body: "Each eBay item may have a different consignor, agreement, price, category, condition note, and payout split. The listing workflow needs those details before the item goes live.",
        bullets: [
          "Track consignor and agreement context before listing.",
          "Prepare title, description, images, and channel details.",
          "Keep item status visible from draft through sold.",
          "Use sale state to support payout reconciliation.",
        ],
      },
      {
        title: "Fit eBay into the shop workflow",
        body: "Clawpify keeps eBay listing work near the rest of the consignment record, so staff do not have to jump between spreadsheets, marketplace drafts, and payout notes.",
      },
      {
        title: "Use with other channels",
        body: "Many resale shops sell through more than one channel. Clawpify is designed as a workspace for inventory and listings across connected storefronts and marketplaces.",
      },
    ],
    faqs: [
      {
        question: "What is eBay consignment software?",
        answer:
          "It is software that helps consignment sellers manage item intake, consignor ownership, eBay listing details, sale status, and payout workflows.",
      },
      {
        question: "Can Clawpify help with eBay listings?",
        answer:
          "Clawpify is being built around connected listing workflows for consignment shops, including marketplace-style listing preparation and account integration work.",
      },
      {
        question: "Why not list directly in eBay only?",
        answer:
          "Direct listing can work for small volume, but consignment shops also need consignor terms, splits, inventory state, and payout reporting outside the marketplace listing itself.",
      },
    ],
    related: [
      { label: "Consignment management software", href: "/consignment-management-software" },
      { label: "Consignment tracking software", href: "/consignment-tracking-software" },
      { label: "Best consignment shop software reviews", href: "/best-consignment-shop-software-reviews" },
    ],
  },
  tracking: {
    eyebrow: "Consignment Tracking Software",
    title: "Consignment tracking software for item status and seller payouts",
    answer:
      "Consignment tracking software shows where every item is in its lifecycle: intake, priced, listed, on floor, online, sold, returned, or ready for payout. Clawpify connects those statuses with consignor terms and listing workflows.",
    sections: [
      {
        title: "Track the full item lifecycle",
        body: "A consignment item changes state many times. Clawpify helps shops keep those transitions visible so staff can answer what happened, where the item is, and what comes next.",
        bullets: [
          "Intake and item records.",
          "Listing preparation and channel status.",
          "Sold and payout-ready states.",
          "Consignor context attached to every item.",
        ],
      },
      {
        title: "Reduce spreadsheet drift",
        body: "When inventory status lives in multiple sheets or staff notes, small misses become payout disputes and listing mistakes. Tracking software gives the team one shared record.",
      },
      {
        title: "Useful for online and in-store resale",
        body: "The same item may be photographed for online sale, held in back stock, moved to floor, or marked sold. A single status trail keeps work coordinated.",
      },
    ],
    faqs: [
      {
        question: "What should consignment tracking software track?",
        answer:
          "It should track item owner, agreement terms, price, status, listing channel, sale state, and payout readiness.",
      },
      {
        question: "Can tracking software help with consignor questions?",
        answer:
          "Yes. Staff can answer whether an item is listed, sold, still active, or ready for payout when the item record is current.",
      },
      {
        question: "Is tracking different from accounting?",
        answer:
          "Yes. Tracking follows item status and ownership. Accounting focuses on money movement, reports, and reconciliation.",
      },
    ],
    related: [
      { label: "Consignment accounting software", href: "/consignment-accounting-software" },
      { label: "eBay consignment software", href: "/ebay-consignment-software" },
      { label: "Consignment stock example", href: "/blog/consignment-stock-example" },
    ],
  },
  accounting: {
    eyebrow: "Consignment Accounting Software",
    title: "Consignment accounting software for splits, fees, and payout reports",
    answer:
      "Consignment accounting software helps shops calculate commission splits, seller payouts, fees, and reports after items sell. Clawpify keeps the operational details that accounting depends on: item ownership, agreement terms, sale status, and payout context.",
    sections: [
      {
        title: "What consignment accounting needs",
        body: "Consignment accounting starts before money moves. If item ownership, split terms, fees, and sale status are wrong, payout reports will be wrong too.",
        bullets: [
          "Consignor-specific agreement terms.",
          "Commission split and fee context.",
          "Sold status tied back to item records.",
          "Reports or exports for bookkeeping workflows.",
        ],
      },
      {
        title: "Operational records before ledger work",
        body: "Clawpify is not positioned as a full general ledger. It supports the item and consignor data that shops need before final bookkeeping or accounting export.",
      },
      {
        title: "Reduce payout disputes",
        body: "Clear item records and seller terms make it easier to explain why a consignor was paid a certain amount and when the payout became due.",
      },
    ],
    faqs: [
      {
        question: "What is consignment accounting software?",
        answer:
          "It is software that helps consignment shops calculate and report seller payouts, commission splits, fees, and sale-related financial records.",
      },
      {
        question: "Does Clawpify replace QuickBooks?",
        answer:
          "No. Clawpify focuses on consignment operations and payout context. Shops can use accounting software for final bookkeeping.",
      },
      {
        question: "Why do consignor terms matter for accounting?",
        answer:
          "The same sale price can create different payouts depending on split percentage, fees, discounts, and agreement rules.",
      },
    ],
    related: [
      { label: "Consignment management software", href: "/consignment-management-software" },
      { label: "Consignment tracking software", href: "/consignment-tracking-software" },
      { label: "What does consignment selling mean?", href: "/blog/what-does-consignment-selling-mean" },
    ],
  },
  reviews: {
    eyebrow: "Best Consignment Shop Software Reviews",
    title: "Best consignment shop software reviews: how to compare tools",
    answer:
      "The best consignment shop software depends on whether your shop needs POS checkout, inventory tracking, online listings, consignor payouts, or multi-channel selling. Compare tools by workflow fit, not by a generic feature checklist.",
    primaryCta: "Compare Clawpify",
    sections: [
      {
        title: "How to compare consignment software",
        body: "Start with the daily workflow: intake, item records, floor or online availability, seller terms, sales, payouts, and reporting. A strong tool should reduce handoffs between those steps.",
        bullets: [
          "Inventory and one-of-one item tracking.",
          "Consignor agreements, splits, and payout reports.",
          "POS or checkout fit, if needed.",
          "Marketplace and storefront listing workflows.",
          "Data export, ownership, and team access.",
        ],
      },
      {
        title: "Common tools buyers research",
        body: "Searchers often compare Liberty, Ricochet, Aravenda, Rose, Quail, open source options, and newer tools like Clawpify. Each product has different strengths, so review current vendor documentation before choosing.",
      },
      {
        title: "Where Clawpify fits",
        body: "Clawpify is best for shops that care about consignment inventory, consignor context, payout readiness, and online listing workflows. It is not framed as a legacy all-in-one POS replacement.",
      },
    ],
    faqs: [
      {
        question: "What is the best consignment shop software?",
        answer:
          "The best choice depends on your shop. POS-heavy stores may prioritize checkout, while online resale teams may prioritize inventory, listings, consignor terms, and payouts.",
      },
      {
        question: "Should I choose the cheapest consignment software?",
        answer:
          "Only if it still covers your core workflow. Cheap software can become expensive if staff must maintain spreadsheets for payouts, listings, and item status.",
      },
      {
        question: "Is open source consignment software worth considering?",
        answer:
          "Yes if your team can host and maintain it. Open source can improve transparency, but shops still need reliable operations, support, and data workflows.",
      },
    ],
    related: [
      { label: "Consignment management software", href: "/consignment-management-software" },
      { label: "Consignment store POS software", href: "/consignment-store-pos-software" },
      { label: "eBay consignment software", href: "/ebay-consignment-software" },
    ],
  },
} satisfies Record<string, SeoPageContent>;

function SeoPage({ content }: { content: SeoPageContent }) {
  return (
    <div className="landing min-h-screen flex flex-col bg-[#f2f3f1]">
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-7 md:px-8 md:pb-20 md:pt-8">
        <Link to="/" className={backLinkClass}>
          ← Back
        </Link>

        <header className="mt-10 max-w-3xl">
          <p className="font-mono text-[0.65rem] font-medium uppercase tracking-widest text-[#8a8378]">
            {content.eyebrow}
          </p>
          <h1 className="landing-serif-headline mt-4 text-balance text-[clamp(2.15rem,5vw,4.25rem)] leading-[1.02] text-zinc-900">
            {content.title}
          </h1>
          <p className="landing-sans-copy mt-6 max-w-2xl text-pretty text-base leading-8 text-zinc-600 md:text-lg">
            {content.answer}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/sign-in"
              className="landing-sans-copy rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              {content.primaryCta ?? "Start with Clawpify"}
            </Link>
            <Link
              to="/blog"
              className="landing-sans-copy rounded-full border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-800 transition hover:border-zinc-500"
            >
              Read guides
            </Link>
          </div>
        </header>

        <div className="mt-16 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <div className="space-y-5">
            {content.sections.map((section) => (
              <section key={section.title} className="border border-zinc-200 bg-white/60 p-6 md:p-8">
                <h2 className="text-xl font-medium leading-snug text-zinc-900">{section.title}</h2>
                <p className="mt-3 text-sm leading-7 text-zinc-600">{section.body}</p>
                {section.bullets && (
                  <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-600">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            <section className="border border-zinc-200 bg-white/60 p-6 md:p-8">
              <h2 className="text-xl font-medium leading-snug text-zinc-900">FAQ</h2>
              <div className="mt-5 divide-y divide-zinc-200">
                {content.faqs.map((faq) => (
                  <div key={faq.question} className="py-5 first:pt-0 last:pb-0">
                    <h3 className="text-sm font-medium text-zinc-900">{faq.question}</h3>
                    <p className="mt-2 text-sm leading-7 text-zinc-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="border border-zinc-200 bg-white/50 p-5 lg:sticky lg:top-8">
            <h2 className="font-mono text-[0.65rem] font-medium uppercase tracking-widest text-[#8a8378]">
              Related
            </h2>
            <nav className="mt-4 flex flex-col gap-3">
              {content.related.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm font-medium leading-snug text-zinc-800 underline-offset-4 transition hover:text-zinc-500 hover:underline"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      </main>
    </div>
  );
}

export function ConsignmentManagementSoftwarePage() {
  return <SeoPage content={pages.management} />;
}

export function ConsignmentStorePosSoftwarePage() {
  return <SeoPage content={pages.pos} />;
}

export function EbayConsignmentSoftwarePage() {
  return <SeoPage content={pages.ebay} />;
}

export function ConsignmentTrackingSoftwarePage() {
  return <SeoPage content={pages.tracking} />;
}

export function ConsignmentAccountingSoftwarePage() {
  return <SeoPage content={pages.accounting} />;
}

export function BestConsignmentShopSoftwareReviewsPage() {
  return <SeoPage content={pages.reviews} />;
}
