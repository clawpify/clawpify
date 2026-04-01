import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Sidebar } from "../landing/components/Sidebar";

const sections: { id: string; title: string; body: ReactNode }[] = [
  {
    id: "overview",
    title: "Overview",
    body: (
      <>
        This Privacy Policy describes how Clawpify (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
        collects, uses, and shares information when you use our website and services (collectively,
        the &quot;Services&quot;). By using the Services, you agree to this policy. If you do not
        agree, please do not use the Services.
      </>
    ),
  },
  {
    id: "collect",
    title: "Information we collect",
    body: (
      <>
        <p className="mt-0">
          <strong className="text-zinc-800">Account and authentication.</strong> We use{" "}
          <a
            href="https://clerk.com/legal/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline transition hover:text-zinc-900"
          >
            Clerk
          </a>{" "}
          to provide sign-in, session management, and (where enabled) organization features. Clerk may
          process identifiers such as your email address, name, and profile data according to their
          privacy policy.
        </p>
        <p className="mt-3">
          <strong className="text-zinc-800">Store and commerce data.</strong> When you connect an
          e-commerce platform (for example Shopify) or use our APIs, we process product, order,
          inventory, and related business data needed to provide listing, optimization, and
          workspace features you configure.
        </p>
        <p className="mt-3">
          <strong className="text-zinc-800">Content you submit.</strong> We process information you
          upload or enter into the Services, such as product descriptions, images, prompts, and
          messages sent through product flows (including optional channels such as SMS or phone
          verification where offered).
        </p>
        <p className="mt-3">
          <strong className="text-zinc-800">Usage and technical data.</strong> We collect log and
          device data typical of web applications, such as IP address, browser type, approximate
          location derived from IP, timestamps, and diagnostic information to operate and secure the
          Services.
        </p>
        <p className="mt-3">
          <strong className="text-zinc-800">Cookies and similar technologies.</strong> We and our
          service providers use cookies and similar technologies for authentication, preferences,
          security, and to understand how the Services are used.
        </p>
      </>
    ),
  },
  {
    id: "use",
    title: "How we use information",
    body: (
      <>
        We use the information above to provide, maintain, and improve the Services; authenticate
        users; connect to third-party platforms you authorize; personalize your workspace; analyze
        product and AI-related performance; communicate with you about the Services; comply with
        law; and protect the security and integrity of our systems and users.
      </>
    ),
  },
  {
    id: "sharing",
    title: "How we share information",
    body: (
      <>
        We may share information with service providers who process data on our behalf (for example
        authentication, hosting, infrastructure, analytics, communications, and AI or search features
        where applicable), with commerce platforms you connect, and when required by law or to
        protect rights and safety. We do not sell your personal information as that term is commonly
        defined in U.S. state privacy laws. If we ever engage in advertising that uses personal
        information in ways that constitute a &quot;sale&quot; under applicable law, we will offer
        any choices required by law.
      </>
    ),
  },
  {
    id: "retention",
    title: "Retention",
    body: (
      <>
        We retain information for as long as needed to provide the Services, comply with legal
        obligations, resolve disputes, and enforce our agreements. Retention periods can vary based
        on the type of data and how you use the Services.
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <>
        We implement technical and organizational measures designed to protect information. No method
        of transmission or storage is completely secure; we cannot guarantee absolute security.
      </>
    ),
  },
  {
    id: "rights",
    title: "Your choices and rights",
    body: (
      <>
        Depending on where you live, you may have rights to access, correct, delete, or export
        certain personal information, or to object to or limit certain processing. You may manage
        some account details through your authentication provider (Clerk) and in-app settings where
        available. To exercise other rights, contact us using the information below. We may need to
        verify your request before responding.
      </>
    ),
  },
  {
    id: "international",
    title: "International transfers",
    body: (
      <>
        We may process and store information in the United States and other countries where we or
        our service providers operate. Those countries may have different data protection rules
        than your country of residence.
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <>
        The Services are not directed to children under 16, and we do not knowingly collect
        personal information from children under 16. If you believe we have collected such
        information, please contact us so we can delete it.
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <>
        We may update this Privacy Policy from time to time. We will post the updated version on
        this page and revise the &quot;Last updated&quot; date below. If changes are material, we
        may provide additional notice as appropriate.
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <>
        Questions about this Privacy Policy? Contact us at{" "}
        <a
          href="mailto:privacy@clawpify.com"
          className="underline transition hover:text-zinc-900"
        >
          privacy@clawpify.com
        </a>
        .
      </>
    ),
  },
];

export function PrivacyPage() {
  return (
    <div className="landing flex min-h-screen bg-[#f2f3f1]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="shrink-0 px-5 pt-7 pb-6 md:px-8 md:pt-7 md:pb-8 lg:px-10">
          <Link
            to="/"
            className="about-mono mb-6 inline-block text-xs font-medium uppercase tracking-wide text-zinc-600 transition hover:text-zinc-900"
          >
            ← Back
          </Link>
          <h1 className="hero-headline text-2xl font-medium text-zinc-900 md:text-3xl">
            Privacy Policy
          </h1>
          <p className="about-mono mt-3 text-sm text-zinc-600">
            Last updated: April 1, 2026
          </p>
        </div>
        <main className="flex-1 overflow-y-auto px-5 pb-16 md:px-8 lg:px-10">
          <article className="max-w-2xl space-y-10">
            {sections.map((section) => (
              <section key={section.id} id={section.id}>
                <h2 className="about-mono text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {section.title}
                </h2>
                <div className="about-mono mt-4 text-sm leading-relaxed text-zinc-600">
                  {section.body}
                </div>
              </section>
            ))}
          </article>
        </main>
      </div>
    </div>
  );
}
