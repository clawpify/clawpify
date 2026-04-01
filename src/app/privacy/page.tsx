import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Sidebar } from "../landing/components/Sidebar";

const effectiveDate = "April 1, 2026";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2 className="about-mono text-xs font-medium uppercase tracking-wide text-zinc-500">{title}</h2>
      <div className="about-mono mt-4 space-y-3 text-sm leading-relaxed text-zinc-700">{children}</div>
    </section>
  );
}

function P({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={className}>{children}</p>;
}

function Ul({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5">{children}</ul>;
}

function Li({ children }: { children: ReactNode }) {
  return <li>{children}</li>;
}

const privacyEmail = "alhwyn@clawpify.com";

export function PrivacyPage() {
  return (
    <div className="landing flex min-h-screen bg-[#f2f3f1]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="shrink-0 px-5 pb-6 pt-7 md:px-8 md:pb-8 md:pt-7 lg:px-10">
          <Link
            to="/"
            className="about-mono mb-6 inline-block text-xs font-medium uppercase tracking-wide text-zinc-600 transition hover:text-zinc-900"
          >
            ← Back
          </Link>
          <h1 className="hero-headline text-2xl font-medium text-zinc-900 md:text-3xl">Privacy Policy</h1>
          <p className="about-mono mt-2 text-sm text-zinc-600">
            Effective date: {effectiveDate}. Clawpify is the product described in this policy.
          </p>
        </div>
        <main className="flex-1 overflow-y-auto px-5 pb-16 md:px-8 lg:px-10">
          <article className="max-w-2xl space-y-10">
            <Section id="operator" title="Who we are">
              <P>
                This policy describes how Clawpify (“we”, “us”) collects, uses, and shares personal
                information when you use Clawpify (the “Service”), including our website and authenticated
                workspace.
              </P>
              <P>
                Contact for privacy questions and requests:{" "}
                <span className="font-medium text-zinc-900">{privacyEmail}</span>. A postal mailing address
                is available on request at this email.
              </P>
            </Section>

            <Section id="collect" title="Information we collect">
              <P>Depending on how you use the Service, we may collect:</P>
              <Ul>
                <Li>
                  <strong className="font-medium text-zinc-900">Account and identity.</strong> When you
                  sign in or create an account, our authentication provider (Clerk) processes
                  identifiers such as email, session data, and organization membership. See{" "}
                  <a
                    href="https://clerk.com/legal/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline transition hover:text-zinc-900"
                  >
                    Clerk’s privacy policy
                  </a>
                  .
                </Li>
                <Li>
                  <strong className="font-medium text-zinc-900">Workspace and business data.</strong>{" "}
                  Content and metadata you provide in your organization workspace, such as consignors,
                  contracts, product listings, store connection settings (for example Shopify or other
                  platforms), and related operational records stored in our systems.
                </Li>
                <Li>
                  <strong className="font-medium text-zinc-900">Photos and files.</strong> Images and
                  other files you upload for listings, stored using object storage; we keep metadata
                  needed to serve uploads securely within your organization.
                </Li>
                <Li>
                  <strong className="font-medium text-zinc-900">SMS intake.</strong> If you enable or use
                  phone-based intake, we may collect and store phone numbers (for example in
                  E.164 format) and related verification data.
                </Li>
                <Li>
                  <strong className="font-medium text-zinc-900">Email subscriptions.</strong> If you
                  submit your email for updates or marketing through our forms, we process that address
                  and related subscription metadata.
                </Li>
                <Li>
                  <strong className="font-medium text-zinc-900">AI-assisted features.</strong> If you use
                  features that call our AI or agent endpoints, we process the prompts, content, and
                  context you submit to provide those features, which may involve third-party model
                  providers acting on our instructions.
                </Li>
                <Li>
                  <strong className="font-medium text-zinc-900">Technical data.</strong> Standard server
                  and diagnostics information such as IP address, device and browser type, timestamps,
                  and request metadata for security, reliability, and support.
                </Li>
              </Ul>
            </Section>

            <Section id="use" title="How we use information">
              <P>We use personal information to:</P>
              <Ul>
                <Li>Provide, operate, and improve the Service;</Li>
                <Li>Authenticate users, enforce org-scoped access, and protect accounts;</Li>
                <Li>Store and display your workspace content, including listings and media;</Li>
                <Li>Integrate with commerce platforms you connect;</Li>
                <Li>Run optional features such as SMS intake or AI-assisted workflows when you use them;</Li>
                <Li>Respond to support requests and comply with legal obligations;</Li>
                <Li>
                  Send service-related messages; where allowed, send marketing if you have opted in or as
                  permitted by law.
                </Li>
              </Ul>
            </Section>

            <Section id="legal-bases" title="Legal bases (EEA, UK, and similar regions)">
              <P>Where applicable privacy law requires a “legal basis”, we rely on:</P>
              <Ul>
                <Li>
                  <strong className="font-medium text-zinc-900">Contract:</strong> processing needed to
                  provide the Service you request;
                </Li>
                <Li>
                  <strong className="font-medium text-zinc-900">Legitimate interests:</strong> securing
                  the Service, debugging, aggregated analytics, and improving features, balanced against
                  your rights;
                </Li>
                <Li>
                  <strong className="font-medium text-zinc-900">Consent:</strong> where we ask for it
                  (for example optional marketing or certain SMS or AI uses), which you may withdraw
                  where the law allows.
                </Li>
              </Ul>
            </Section>

            <Section id="sharing" title="Sharing and subprocessors">
              <P>We share information with:</P>
              <Ul>
                <Li>
                  <strong className="font-medium text-zinc-900">Clerk</strong> for authentication and
                  organization features;
                </Li>
                <Li>
                  <strong className="font-medium text-zinc-900">Infrastructure providers</strong> that host
                  our application, database, and object storage;
                </Li>
                <Li>
                  <strong className="font-medium text-zinc-900">Communications providers</strong> (such as
                  SMS or email delivery) when those features are used;
                </Li>
                <Li>
                  <strong className="font-medium text-zinc-900">Model or AI vendors</strong> when you use
                  AI-assisted capabilities that send content for processing;
                </Li>
                <Li>
                  <strong className="font-medium text-zinc-900">Professional advisors or authorities</strong>{" "}
                  where required by law or to protect rights and safety.
                </Li>
              </Ul>
              <P>
                We do not sell your personal information as “sale” is defined under US state privacy laws.
                We may use subprocessors who process data on our behalf under contractual terms.
              </P>
            </Section>

            <Section id="retention" title="Retention">
              <P>
                We retain information for as long as your account or organization is active and as needed
                to provide the Service, comply with law, resolve disputes, and enforce agreements. Retention
                periods may vary by data category; you may request deletion subject to legal exceptions.
              </P>
            </Section>

            <Section id="security" title="Security">
              <P>
                We use administrative, technical, and organizational measures intended to protect personal
                information, including encryption in transit, access controls, and organization-scoped data
                boundaries. No method of transmission or storage is perfectly secure.
              </P>
            </Section>

            <Section id="rights" title="Your privacy rights">
              <P>
                Depending on where you live, you may have rights to access, correct, delete, or export
                personal information; to object to or restrict certain processing; to opt out of
                targeted advertising or “sales”/sharing where those terms apply; and to appeal our
                decisions. California residents may have additional rights under the CPRA. EEA and UK
                residents may lodge a complaint with a supervisory authority.
              </P>
              <P>
                To exercise rights, contact{" "}
                <span className="font-medium text-zinc-900">{privacyEmail}</span>. We may need to verify
                your request. If we act as a processor for your organization’s data in some cases, we may
                refer you to your workspace administrator.
              </P>
            </Section>

            <Section id="transfers" title="International transfers">
              <P>
                We may process and store information in the United States and other countries where we or
                our providers operate. When we transfer personal information from the EEA, UK, or
                Switzerland, we use appropriate safeguards such as standard contractual clauses where
                required.
              </P>
            </Section>

            <Section id="cookies" title="Cookies and similar technologies">
              <P>
                We and our authentication provider use cookies and similar technologies that are necessary
                for security and session management. Additional cookies may apply if we enable analytics
                or similar tools; we will describe material changes on this page where required.
              </P>
            </Section>

            <Section id="children" title="Children">
              <P>
                The Service is not directed to children under 13 (or the minimum age required in your
                region), and we do not knowingly collect their personal information.
              </P>
            </Section>

            <Section id="changes" title="Changes to this policy">
              <P>
                We may update this policy from time to time. We will post the updated version on this page
                and revise the effective date. If changes are material, we will provide additional notice
                where the law requires.
              </P>
            </Section>

            <Section id="disclaimer" title="Notice">
              <P className="text-zinc-600">
                This policy is provided for transparency. It is not legal advice; have qualified counsel
                review it before relying on it for compliance.
              </P>
            </Section>
          </article>
        </main>
      </div>
    </div>
  );
}
