import { Link } from "react-router-dom";
import { Newsletter } from "./components/Newsletter";
import { posts } from "./utils/posts";

export function WritingPage() {
  return (
    <div className="landing flex h-screen flex-col overflow-hidden bg-[#f2f3f1]">
      <div className="flex flex-1 flex-col min-w-0">
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-5 pt-12 pb-10 md:px-8">
            <header className="mb-10">
              <h1 className="font-mono text-[0.65rem] font-medium uppercase tracking-widest text-[#8a8378] mb-4">
                Writing
              </h1>
              <p className="text-[1.1rem] leading-relaxed text-[#6b6455] max-w-xl">
                Thoughts on AI commerce, product discovery, and the shift from search to agents.
              </p>
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
                    <div className="flex items-center gap-3 mb-2.5">
                      <span className="font-mono text-[0.6rem] font-medium uppercase tracking-widest text-[#8a8378]">
                        {post.category}
                      </span>
                      <span className="text-[0.55rem] text-zinc-300">|</span>
                      <span className="font-mono text-[0.6rem] text-[#8a8378]">
                        {post.date}
                      </span>
                    </div>
                    <h2 className="text-[1.25rem] font-medium leading-tight text-[#26251e] group-hover:text-[#555] transition-colors mb-2">
                      {post.title}
                    </h2>
                    <p className="text-[0.88rem] leading-relaxed text-[#6b6455] max-w-2xl">
                      {post.description}
                    </p>
                    <span className="inline-block mt-3 font-mono text-[0.65rem] font-medium uppercase tracking-widest text-[#8a8378] group-hover:text-[#26251e] transition-colors">
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
    </div>
  );
}
