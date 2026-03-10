# Clawpify Backend

Rust backend for the audit service (crawl, insight, stores, audits).

## Setup

1. Create a `.env` file in the backend directory (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set:
   - `DATABASE_URL` – PostgreSQL connection string (required)
   - `OPENAI_API_KEY` – for ChatGPT citation (required)
   - `OPENAI_PROMPT_MODEL` – optional, model for prompt generation (default: gpt-4o-mini)
   - `OPENAI_CITATION_MODEL` – optional, model for citation search (default: gpt-4o)
   - `FIRECRAWL_API_KEY` – optional, for better website scraping

2. Run migrations (from project root):
   ```bash
   psql $DATABASE_URL -f migrations/001_initial_schema.sql
   psql $DATABASE_URL -f migrations/002_organizations_and_constraints.sql
   psql $DATABASE_URL -f migrations/003_chatgpt_citation.sql
   ```
3. Generate sqlx query cache (for offline builds): `cargo sqlx prepare`

## Tests

**Unit tests** (no network, no DB):

```bash
SQLX_OFFLINE=true cargo test --lib audit::insight::tests
SQLX_OFFLINE=true cargo test --lib audit::crawl::tests
```

**LLM citation integration tests** (require network, use real URLs):

```bash
cargo test --test llm_citation_test -- --ignored
```

Or with `DATABASE_URL` set for full build:

```bash
cargo test --test llm_citation_test -- --ignored
```

Test URLs: alhwyn.com, atcyrus.com, juniorscheesecake.com
