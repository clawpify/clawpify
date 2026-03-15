import whyWeChoseToOpenSourceClawpify from "./posts/why-we-chose-to-open-source-clawpify.mdx" with { type: "text" };

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  content: string;
}

type BlogFrontmatter = Omit<BlogPost, "content">;

function parseFrontmatter(source: string): BlogPost {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!match) {
    throw new Error("Blog post is missing frontmatter.");
  }

  const rawFrontmatter = match[1] ?? "";
  const rawContent = match[2] ?? "";
  const frontmatter = Object.fromEntries(
    rawFrontmatter
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separatorIndex = line.indexOf(":");
        if (separatorIndex === -1) {
          throw new Error(`Invalid frontmatter line: ${line}`);
        }

        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim().replace(/^"(.*)"$/, "$1");
        return [key, value];
      }),
  ) as Partial<BlogFrontmatter>;

  const requiredFields: Array<keyof BlogFrontmatter> = [
    "slug",
    "title",
    "description",
    "author",
    "date",
    "category",
    "readTime",
  ];

  for (const field of requiredFields) {
    if (!frontmatter[field]) {
      throw new Error(`Blog post frontmatter is missing "${field}".`);
    }
  }

  return {
    slug: frontmatter.slug!,
    title: frontmatter.title!,
    description: frontmatter.description!,
    author: frontmatter.author!,
    date: frontmatter.date!,
    category: frontmatter.category!,
    readTime: frontmatter.readTime!,
    content: rawContent.trim(),
  };
}

export const posts: BlogPost[] = [whyWeChoseToOpenSourceClawpify].map(parseFrontmatter);
