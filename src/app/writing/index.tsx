import { Link } from "react-router-dom";
import { Newsletter } from "./components/Newsletter";
import { posts } from "./utils/posts";

const backLinkClass =
  "inline-block font-mono text-[0.65rem] font-medium uppercase tracking-widest text-[#8a8378] transition hover:text-[#26251e]";

export function WritingPage() {
  return (
    <div className="landing min-h-screen flex flex-col bg-[#f2f3f1]">
      <main className="w-full min-w-0 flex-1">
        <div className="mx-auto max-w-3xl px-5 pb-10 pt-7 md:px-8 md:pt-8">
          <Link to="/" className={backLinkClass}>
            ← Back
          </Link>

          <header className="mb-12 mt-8">
            <p className="font-mono text-[0.65rem] font-medium uppercase tracking-widest text-[#8a8378]">
              Writing
            </p>
            <h1 className="mt-3 max-w-2xl text-[1.65rem] font-medium leading-[1.2] tracking-tight text-[#26251e] md:text-[1.85rem]">
              Consignment operations, listings, channels, and how product discovery is changing.
            </h1>
          </header>

          <div className="flex flex-col">
            {posts.map((post, i) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group block"
              >
                <article
                  className={`py-7 ${
                    i !== posts.length - 1 ? "border-b border-zinc-200" : ""
                  }`}
                >
                  <div className="mb-2.5 flex items-center gap-3">
                    <span className="font-mono text-[0.6rem] font-medium uppercase tracking-widest text-[#8a8378]">
                      {post.category}
                    </span>
                    <span className="text-[0.55rem] text-zinc-300">|</span>
                    <span className="font-mono text-[0.6rem] text-[#8a8378]">{post.date}</span>
                  </div>
                  <h2 className="mb-2 text-[1.25rem] font-medium leading-tight text-[#26251e] transition-colors group-hover:text-[#555]">
                    {post.title}
                  </h2>
                  <p className="max-w-2xl text-[0.88rem] leading-relaxed text-[#6b6455]">
                    {post.description}
                  </p>
                  <span className="mt-3 inline-block font-mono text-[0.65rem] font-medium uppercase tracking-widest text-[#8a8378] transition-colors group-hover:text-[#26251e]">
                    Read article →
                  </span>
                </article>
              </Link>
            ))}
          </div>
        </div>
        <Newsletter />
      </main>
    </div>
  );
}
