const DEFAULT_PROMPT_MODEL: &str = "gpt-4o-mini";
const DEFAULT_CITATION_MODEL: &str = "gpt-4o";
const MARKDOWN_TRUNCATE_CHARS: usize = 4000;

pub fn prompt_model() -> String {
    std::env::var("OPENAI_PROMPT_MODEL")
        .ok()
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| DEFAULT_PROMPT_MODEL.to_string())
}

pub fn citation_model() -> String {
    std::env::var("OPENAI_CITATION_MODEL")
        .ok()
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| DEFAULT_CITATION_MODEL.to_string())
}

pub fn markdown_truncate_chars() -> usize {
    MARKDOWN_TRUNCATE_CHARS
}

pub fn build_queries(product_description: &str, custom_prompts: Option<&[String]>) -> Vec<String> {
    const FALLBACK_QUERIES: &[&str] = &[
        "What are the best {} tools or solutions? List specific companies and products with sources.",
        "Recommend {} for B2B. Which companies should I consider?",
        "Top {} products and vendors",
        "Compare {} solutions. Which ones are worth trying?",
        "I need {} for my business. What do you recommend?",
    ];

    if let Some(prompts) = custom_prompts {
        if !prompts.is_empty() {
            return prompts.to_vec();
        }
    }

    FALLBACK_QUERIES
        .iter()
        .map(|tpl| tpl.replace("{}", product_description))
        .collect()
}

pub fn build_gist_prompt(truncated_content: &str) -> String {
    format!(
        "Summarize in 2–3 sentences what this company/product does based on this website content:\n\n{}",
        truncated_content
    )
}

pub fn build_prompts_prompt(
    company_name: &str,
    domain: &str,
    gist: Option<&str>,
) -> String {
    const PROMPTS_JSON_INSTRUCTIONS: &str = r#"Generate a JSON object with exactly two keys:
1. "prompts": an array of 5 search queries that someone might ask ChatGPT when looking for products/services like this company offers. Each query should be the kind that would return product recommendations with citations. Examples: "What are the best X tools?", "Recommend X for B2B".
2. "competitors": an array of 5-10 competitor company/brand names that operate in the same space.

Return ONLY valid JSON, no other text."#;

    if let Some(g) = gist {
        format!(
            r#"Company: "{}". Website: {}.

Website gist: {}

{}"#,
            company_name,
            domain,
            g,
            PROMPTS_JSON_INSTRUCTIONS
        )
    } else {
        format!(
            r#"Given this company: "{}" (website: {}).

{}"#,
            company_name,
            domain,
            PROMPTS_JSON_INSTRUCTIONS
        )
    }
}
