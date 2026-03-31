/** Turn plain text (newlines) into simple safe HTML for `description_html`. */
export function plainTextToDescriptionHtml(text: string): string {
  const t = text.trim();
  if (!t) return "";
  const esc = t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r\n/g, "\n");
  const parts = esc.split("\n");
  return parts.map((line) => (line === "" ? "<br />" : `<p>${line}</p>`)).join("");
}
