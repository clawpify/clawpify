import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useParams, Link } from "react-router-dom";
import { Newsletter } from "./Newsletter";
import { posts } from "../utils/posts";

/**
 * Table of contents component for a blog post.
 *
 * @param headings - The headings to display in the table of contents.
 */
function TableOfContents({ headings }: { headings: string[] }) {
  return (
    <nav className="hidden lg:block sticky top-24 self-start w-52 shrink-0">
      <h4 className="font-mono text-[0.6rem] font-medium uppercase tracking-widest text-[#8a8378] mb-4">
        Table of contents
      </h4>
      <ul className="flex flex-col gap-2">
        {headings.map((h) => (
          <li key={h}>
            <a
              href={`#${h.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              className="text-[0.78rem] text-[#6b6455] hover:text-[#26251e] transition-colors leading-snug block"
            >
              {h}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Slugify a heading.
 *
 * @param value - The heading to slugify.
 * @returns The slugified heading.
 */
function slugifyHeading(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/**
 * Get the text content of a React node.
 *
 * @param node - The React node to get the text content of.
 * @returns The text content of the node.
 */
function getNodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);

  if (Array.isArray(node)) return node.map(getNodeText).join("");

  if (node && typeof node === "object" && "props" in node) return getNodeText((node as { props?: { children?: ReactNode } }).props?.children ?? "");

  return "";
}

/**
 * Writing post page component.
 *
 * @returns The writing post page component.
 */
export function WritingPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = posts.find((p) => p.slug === slug);
  const relatedPosts = post ? posts.filter((p) => p.slug !== post.slug).slice(0, 2) : [];

  if (!post) {
    return (
      <div className="landing flex h-screen flex-col overflow-hidden bg-[#f2f3f1]">
        <div className="flex flex-1 flex-col min-w-0">
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-5 pt-32 pb-24 md:px-8 text-center">
              <h1 className="text-2xl font-medium text-[#26251e] mb-4">
                Post not found
              </h1>
              <Link
                to="/blog"
                className="font-mono text-[0.72rem] font-medium uppercase tracking-widest text-[#8a8378] hover:text-[#26251e] transition-colors"
              >
                ← Back to Writing
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const headings = Array.from(post.content.matchAll(/^##\s+(.+)$/gm), (match) => match[1]!.trim());

  return (
    <div className="landing flex h-screen flex-col overflow-hidden bg-[#f2f3f1]">
      <div className="flex flex-1 flex-col min-w-0">
        <main className="flex-1 overflow-y-auto">
          <article className="mx-auto max-w-5xl px-5 pt-12 pb-10 md:px-8">
            <Link
              to="/blog"
              className="inline-block font-mono text-[0.65rem] font-medium uppercase tracking-widest text-[#8a8378] hover:text-[#26251e] transition-colors mb-10"
            >
              ← All posts
            </Link>

            <header className="mb-12 max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-[0.6rem] font-medium uppercase tracking-widest text-[#8a8378]">
                  {post.category}
                </span>
              </div>
              <h1 className="text-[clamp(1.6rem,4vw,2.5rem)] font-medium leading-[1.1] tracking-tight text-[#26251e] mb-5">
                {post.title}
              </h1>
              <p className="text-[1rem] leading-relaxed text-[#6b6455] mb-6">
                {post.description}
              </p>
              <div className="flex items-center gap-4 pt-2 border-t border-zinc-200">
                <div className="flex items-center gap-3 py-3">
                  <div className="h-8 w-8 bg-[#b5ddfb] flex items-center justify-center">
                    <span className="text-[0.65rem] font-medium text-[#26251e] uppercase">
                      {post.author[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-[0.82rem] font-medium text-[#26251e]">
                      {post.author}
                    </p>
                    <p className="font-mono text-[0.62rem] text-[#8a8378]">
                      {post.date} · {post.readTime}
                    </p>
                  </div>
                </div>
              </div>
            </header>

            <div className="flex gap-12 items-start">
              <div className="min-w-0 max-w-2xl flex-1">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({ children }) => {
                      const text = getNodeText(children);
                      return (
                        <h2
                          id={slugifyHeading(text)}
                          className="mt-10 mb-4 scroll-mt-24 text-[1.35rem] font-medium text-[#26251e]"
                        >
                          {children}
                        </h2>
                      );
                    },
                    p: ({ children }) => (
                      <p className="mb-5 text-[0.95rem] leading-[1.75] text-[#444]">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-5 list-disc space-y-2 pl-5 text-[0.95rem] leading-[1.75] text-[#444]">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-5 list-decimal space-y-2 pl-5 text-[0.95rem] leading-[1.75] text-[#444]">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => <li>{children}</li>,
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        className="text-[#26251e] underline underline-offset-2 transition hover:text-[#555]"
                      >
                        {children}
                      </a>
                    ),
                    strong: ({ children }) => <strong className="font-medium text-[#26251e]">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    code: ({ children }) => (
                      <code className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[0.85em] text-[#26251e]">
                        {children}
                      </code>
                    ),
                  }}
                >
                  {post.content}
                </ReactMarkdown>
              </div>
              {headings.length > 0 && <TableOfContents headings={headings} />}
            </div>

            {relatedPosts.length > 0 && (
              <div className="mt-16 pt-8 border-t border-zinc-200 max-w-2xl">
                <h3 className="font-mono text-[0.6rem] font-medium uppercase tracking-widest text-[#8a8378] mb-5">
                  Related articles
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {relatedPosts.map((related) => (
                    <Link
                      key={related.slug}
                      to={`/blog/${related.slug}`}
                      className="group block border border-zinc-200 bg-white p-5 hover:border-zinc-300 transition-colors"
                    >
                      <span className="font-mono text-[0.55rem] font-medium uppercase tracking-widest text-[#8a8378]">
                        {related.category}
                      </span>
                      <h4 className="text-[0.92rem] font-medium text-[#26251e] mt-2 leading-snug group-hover:text-[#555] transition-colors">
                        {related.title}
                      </h4>
                      <p className="text-[0.78rem] text-[#6b6455] mt-1.5 leading-relaxed line-clamp-2">
                        {related.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>
          <Newsletter />
        </main>
      </div>
    </div>
  );
}
