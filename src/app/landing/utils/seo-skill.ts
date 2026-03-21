/**
 * Shopify SEO Sidekick skill - URL for Shopify admin, prompt text for Cursor/Claude
 */

export const SHOPIFY_SIDEKICK_SEO_URL =
  "https://admin.shopify.com/sidekick?sk_s=seo-shopify&sk_p=---%0Aname%3A+seo-shopify%0Adescription%3A+Review+and+improve+SEO+on+Shopify+stores.+Use+when+the+user+mentions+%22Shopify+SEO%2C%22+%22Shopify+product+SEO%2C%22+%22Shopify+meta+tags%2C%22+%22product+page+ranking%2C%22+%22Shopify+schema%2C%22+%22Liquid+SEO%2C%22+%22Shopify+store+review%2C%22+or+%22e-commerce+product+SEO.%22%0Aversion%3A+1.0.0%0A---%0A%0A%23+Shopify+SEO%0A%0APlatform-specific+SEO+for+Shopify+stores.+Complements+general+SEO+reviews+with+e-commerce+and+Shopify-native+checks.%0A%0A%23%23+Shopify+SEO+Basics%0A%0A**Online+Store+%3E+Preferences%3A**+Title+and+meta+description+for+homepage.+Customize+per+product%2Fcollection+in+product%2Fcollection+settings+or+via+theme.%0A%0A**Theme+SEO%3A**+Meta+tags+live+in+%60theme.liquid%60%2C+%60product.liquid%60%2C+%60collection.liquid%60.+JSON-LD+is+often+injected+in+theme+or+via+apps.%0A%0A%23%23+Product+Page+SEO%0A%0A%23%23%23+Title+%26+Meta%0A%0A-+**Lead+with+product+name+%2B+primary+keyword.**+Shopify+default+appends+store+name+%28wastes+20%E2%80%9330+chars%29%3B+use+custom+meta+templates.%0A-+**Title%3A**+30%E2%80%9370+chars+visible+in+SERP.+Avoid+truncation.%0A-+**Meta+description%3A**+150%E2%80%93160+chars%2C+includes+keyword%2C+value+proposition%2C+CTA.%0A-+**H1%3A**+Product+name%3B+most+themes+set+this+automatically.%0A%0A%23%23%23+Product+Schema%0A%0ARequired+for+rich+snippets.+Include%3A%0A-+%60%40type%60%3A+Product%0A-+%60name%60%2C+%60description%60%2C+%60image%60%0A-+%60offers%60+with+%60price%60%2C+%60priceCurrency%60%2C+%60availability%60%0A-+%60aggregateRating%60+for+reviews+%28review+app+or+built-in%29%0A%0AIncomplete+schema+%3D+no+rich+snippets.+Valid+schema+can+double+CTR.%0A%0A%23%23%23+Descriptions%0A%0A-+**150%E2%80%93400+words**+per+product%2C+unique.%0A-+Use+headings%2C+bold%2C+lists%3B+avoid+walls+of+text.%0A-+Include+variants%2C+specs%2C+use+cases.%0A-+Long-tail+keywords+naturally.%0A%0A%23%23%23+Images%0A%0A-+Compress+under+200+KB%3B+Shopify+serves+WebP.%0A-+Keyword-rich+alt+text+on+every+image.%0A-+Multiple+angles%3B+highlight+key+features.%0A%0A%23%23%23+Internal+Linking%0A%0A-+Link+to+parent+collection%2C+related+products%2C+blog+posts.%0A-+Descriptive+anchor+text.%0A-+Improves+crawl+and+session+duration.%0A%0A%23%23+Collection+Pages%0A%0A-+**Thin+content%3A**+Add+unique+descriptions%2C+100%2B+words.%0A-+**Pagination%3A**+%60%3Fpage%3D2%60+%E2%80%94+ensure+canonicals+and+noindex+on+paginated+pages+if+needed.%0A-+**Faceted+filters%3A**+Can+create+duplicate+URLs%3B+use+%60rel%3D%22canonical%22%60+and%2For+%60noindex%60+on+filter+combos.%0A-+**Nesting%3A**+Limit+to+3+levels+max+to+avoid+duplicate+content.%0A%0A%23%23+URL+Structure%0A%0A-+%60%2Fproducts%2Fhandle%60+%E2%80%94+clean%2C+descriptive+handles.%0A-+%60%2Fcollections%2Fhandle%60+%E2%80%94+same+for+collections.%0A-+Avoid+%60%2Fcollections%2Fcategory%2Fproducts%2Fproduct%60+deep+nesting.%0A%0A%23%23+Sitemap+%26+Discovery%0A%0A-+**sitemap.xml%3A**+Shopify+generates+automatically+at+%60%2Fsitemap.xml%60.%0A-+**products.json%3A**+%60https%3A%2F%2Fstore.myshopify.com%2Fproducts.json%60+%E2%80%94+used+by+crawlers+for+product+discovery.%0A-+Submit+sitemap+to+search+engines.%0A%0A%23%23+Common+Shopify+SEO+Mistakes%0A%0A%7C+Mistake+%7C+Impact+%7C+Fix+%7C%0A%7C---------%7C--------%7C-----%7C%0A%7C+Default+meta+title+%28store+name+appended%29+%7C+Pushes+keywords+past+60+chars%3B+up+to+40%25+traffic+loss+%7C+Custom+meta+templates%2C+lead+with+product+name+%7C%0A%7C+Thin%2Fduplicate+descriptions+%7C+Hard+to+rank%3B+poor+UX+%7C+150%E2%80%93400+words%2C+unique+per+product+%7C%0A%7C+Oversized+images%2C+no+alt+text+%7C+Slow+load%3B+no+image+search+%7C+Compress+%3C200+KB%2C+descriptive+alt+%7C%0A%7C+Incomplete+Product+schema+%7C+No+rich+snippets+%7C+Price%2C+availability%2C+AggregateRating+%7C%0A%7C+Deep+collection+nesting+%7C+Duplicate+content+%7C+Max+3+levels%3B+proper+canonicals+%7C%0A%7C+Keyword+stuffing+%7C+Spam+signal%3B+lower+rankings+%7C+Natural%2C+helpful+copy+%7C%0A%7C+Too+many+apps+%7C+Slow+page+speed+%7C+Use+Built+for+Shopify+apps%3B+measure+impact+%7C%0A%7C+Discontinued+products+indexed+%7C+High+bounce%3B+poor+crawl+%7C+Remove+or+noindex%3B+fix+internal+links+%7C%0A%0A%23%23+Theme+%26+Liquid%0A%0A**Where+meta+lives%3A**%0A-+%60theme.liquid%60+%E2%80%94+global+head%0A-+%60product.liquid%60+%E2%80%94+product-specific+meta%0A-+%60collection.liquid%60+%E2%80%94+collection+meta%0A%0A**JSON-LD%3A**+Often+in+%60product.liquid%60+or+injected+by+SEO+apps.+Verify+by+rendering+the+page+and+inspecting+%60script%5Btype%3D%22application%2Fld%2Bjson%22%5D%60..%0A%0A%23%23+Google+Merchant+Center%0A%0A-+Required+for+%22Popular+Products%22+and+Shopping.%0A-+Use+the+platform%27s+Merchant+Center+integration.%0A-+Sync+product+data%2C+prices%2C+availability.%0A%0A%23%23+Page+Speed%0A%0A-+Target+%3C3s+desktop%2C+%3C9s+mobile.%0A-+Compress+images%2C+limit+apps.%0A-+Use+Built+for+Shopify+apps+when+possible.%0A%0A%23%23+Related+Skills%0A%0A-+**seo-review%3A**+Full+technical+and+on-page+review%0A-+**seo-developer%3A**+Implementing+meta%2C+schema%2C+and+fixes+in+Liquid%2Ftheme+code";

/** Decoded skill prompt text for Cursor and Claude (copy to clipboard) */
export const SEO_SKILL_PROMPT_TEXT = `---
name: seo-shopify
description: Review and improve SEO on Shopify stores. Use when the user mentions "Shopify SEO," "Shopify product SEO," "Shopify meta tags," "product page ranking," "Shopify schema," "Liquid SEO," "Shopify store review," or "e-commerce product SEO."
version: 1.0.0
---

# Shopify SEO

Platform-specific SEO for Shopify stores. Complements general SEO reviews with e-commerce and Shopify-native checks.

## Shopify SEO Basics

**Online Store > Preferences:** Title and meta description for homepage. Customize per product/collection in product/collection settings or via theme.

**Theme SEO:** Meta tags live in \`theme.liquid\`, \`product.liquid\`, \`collection.liquid\`. JSON-LD is often injected in theme or via apps.

## Product Page SEO

### Title & Meta

- **Lead with product name + primary keyword.** Shopify default appends store name (wastes 20–30 chars); use custom meta templates.
- **Title:** 30–70 chars visible in SERP. Avoid truncation.
- **Meta description:** 150–160 chars, includes keyword, value proposition, CTA.
- **H1:** Product name; most themes set this automatically.

### Product Schema

Required for rich snippets. Include:
- \`@type\`: Product
- \`name\`, \`description\`, \`image\`
- \`offers\` with \`price\`, \`priceCurrency\`, \`availability\`
- \`aggregateRating\` for reviews (review app or built-in)

Incomplete schema = no rich snippets. Valid schema can double CTR.

### Descriptions

- **150–400 words** per product, unique.
- Use headings, bold, lists; avoid walls of text.
- Include variants, specs, use cases.
- Long-tail keywords naturally.

### Images

- Compress under 200 KB; Shopify serves WebP.
- Keyword-rich alt text on every image.
- Multiple angles; highlight key features.

### Internal Linking

- Link to parent collection, related products, blog posts.
- Descriptive anchor text.
- Improves crawl and session duration.

## Collection Pages

- **Thin content:** Add unique descriptions, 100+ words.
- **Pagination:** \`?page=2\` — ensure canonicals and noindex on paginated pages if needed.
- **Faceted filters:** Can create duplicate URLs; use \`rel="canonical"\` and/or \`noindex\` on filter combos.
- **Nesting:** Limit to 3 levels max to avoid duplicate content.

## URL Structure

- \`/products/handle\` — clean, descriptive handles.
- \`/collections/handle\` — same for collections.
- Avoid \`/collections/category/products/product\` deep nesting.

## Sitemap & Discovery

- **sitemap.xml:** Shopify generates automatically at \`/sitemap.xml\`.
- **products.json:** \`https://store.myshopify.com/products.json\` — used by crawlers for product discovery.
- Submit sitemap to search engines.

## Common Shopify SEO Mistakes

| Mistake | Impact | Fix |
|---------|--------|-----|
| Default meta title (store name appended) | Pushes keywords past 60 chars; up to 40% traffic loss | Custom meta templates, lead with product name |
| Thin/duplicate descriptions | Hard to rank; poor UX | 150–400 words, unique per product |
| Oversized images, no alt text | Slow load; no image search | Compress <200 KB, descriptive alt |
| Incomplete Product schema | No rich snippets | Price, availability, AggregateRating |
| Deep collection nesting | Duplicate content | Max 3 levels; proper canonicals |
| Keyword stuffing | Spam signal; lower rankings | Natural, helpful copy |
| Too many apps | Slow page speed | Use Built for Shopify apps; measure impact |
| Discontinued products indexed | High bounce; poor crawl | Remove or noindex; fix internal links |

## Theme & Liquid

**Where meta lives:**
- \`theme.liquid\` — global head
- \`product.liquid\` — product-specific meta
- \`collection.liquid\` — collection meta

**JSON-LD:** Often in \`product.liquid\` or injected by SEO apps. Verify by rendering the page and inspecting \`script[type="application/ld+json"]\`.

## Google Merchant Center

- Required for "Popular Products" and Shopping.
- Use the platform's Merchant Center integration.
- Sync product data, prices, availability.

## Page Speed

- Target <3s desktop, <9s mobile.
- Compress images, limit apps.
- Use Built for Shopify apps when possible.

## Related Skills

- **seo-review:** Full technical and on-page review
- **seo-developer:** Implementing meta, schema, and fixes in Liquid/theme code`;

/**
 * Generate Cursor prompt deeplink - opens Cursor with the prompt pre-filled.
 * @see https://cursor.com/docs/reference/deeplinks
 */
const IS_WEB = true; // Web format for links from browser

function generatePromptDeeplink(promptText: string): string {
  const baseUrl = IS_WEB
    ? "https://cursor.com/link/prompt"
    : "cursor://anysphere.cursor-deeplink/prompt";
  const url = new URL(baseUrl);
  url.searchParams.set("text", promptText);
  return url.toString();
}

export const CURSOR_PROMPT_DEEPLINK = generatePromptDeeplink(SEO_SKILL_PROMPT_TEXT);
