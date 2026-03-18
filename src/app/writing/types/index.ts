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

export type BlogFrontmatter = Omit<BlogPost, "content">;
