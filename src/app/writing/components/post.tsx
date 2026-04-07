import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { renderBlogMarkdownToSafeHtml } from "../../../lib/blogMarkdownHtml";
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
 * Writing post page component.
 *
 * @returns The writing post page component.
 */
export function WritingPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = posts.find((p) => p.slug === slug);
  const relatedPosts = post ? posts.filter((p) => p.slug !== post.slug).slice(0, 2) : [];

  const articleHtml = useMemo(
    () => (post ? renderBlogMarkdownToSafeHtml(post.content) : ""),
    [post]
  );

  const proseClassName = [
    "[&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:scroll-mt-24 [&_h2]:text-[1.35rem] [&_h2]:font-medium [&_h2]:text-[#26251e]",
    "[&_p]:mb-5 [&_p]:text-[0.95rem] [&_p]:leading-[1.75] [&_p]:text-[#444]",
    "[&_ul]:mb-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:text-[0.95rem] [&_ul]:leading-[1.75] [&_ul]:text-[#444]",
    "[&_ol]:mb-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_ol]:text-[0.95rem] [&_ol]:leading-[1.75] [&_ol]:text-[#444]",
    "[&_a]:text-[#26251e] [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition [&_a]:hover:text-[#555]",
    "[&_strong]:font-medium [&_strong]:text-[#26251e]",
    "[&_em]:italic",
    "[&_code]:rounded [&_code]:bg-black/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-[#26251e]",
  ].join(" ");

  if (!post) {
    return (
      <div className="landing min-h-screen flex flex-col bg-[#f2f3f1]">
        <main className="flex-1 px-5 pb-24 pt-32 text-center md:px-8">
          <h1 className="mb-4 text-2xl font-medium text-[#26251e]">Post not found</h1>
          <Link
            to="/blog"
            className="font-mono text-[0.72rem] font-medium uppercase tracking-widest text-[#8a8378] transition-colors hover:text-[#26251e]"
          >
            ← All posts
          </Link>
        </main>
      </div>
    );
  }

  const headings = Array.from(post.content.matchAll(/^##\s+(.+)$/gm), (match) => match[1]!.trim());

  return (
    <div className="landing min-h-screen flex flex-col bg-[#f2f3f1]">
      <main className="w-full min-w-0 flex-1">
        <article className="mx-auto max-w-5xl px-5 pb-10 pt-7 md:px-8 md:pt-8">
            <Link
              to="/blog"
              className="mb-10 inline-block font-mono text-[0.65rem] font-medium uppercase tracking-widest text-[#8a8378] transition-colors hover:text-[#26251e]"
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
              <div
                className={`min-w-0 max-w-2xl flex-1 ${proseClassName}`}
                dangerouslySetInnerHTML={{ __html: articleHtml }}
              />
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
  );
}
