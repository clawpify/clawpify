import DOMPurify from "dompurify";
import { Marked } from "marked";

function slugifyHeading(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

const blogMarked = new Marked();
blogMarked.use({
  gfm: true,
  renderer: {
    heading({ tokens, depth }) {
      const body = this.parser.parseInline(tokens);
      if (depth === 2) {
        const plain = body.replace(/<[^>]+>/g, "").trim();
        const id = slugifyHeading(plain);
        return `<h2 id="${id}">${body}</h2>\n`;
      }
      return `<h${depth}>${body}</h${depth}>\n`;
    },
  },
});

/**
 * Blog post body: Markdown to sanitized HTML with stable `h2` ids for the table of contents.
 */
export function renderBlogMarkdownToSafeHtml(markdown: string): string {
  const raw = blogMarked.parse(markdown.trim() || "", { async: false });
  return DOMPurify.sanitize(raw);
}
