# Clawpify

[![CI](https://github.com/clawpify/clawpify/actions/workflows/ci.yml/badge.svg)](https://github.com/clawpify/clawpify/actions/workflows/ci.yml)

**Open-source SEO and AEO tool for commerce.**

AI is increasingly driving purchasing decisions and recommendations for people, as well as Agent-to-Agent commerce. Clawpify helps merchants prepare for this shift by auditing AI citations, tracking visibility across AI assistants, and improving how your products appear in AI-powered search and recommendations.

## What Clawpify Does

- **Audit AI citations** – Check how your Shopify store is cited by AI assistants
- **Track visibility** – Monitor your presence across AI assistants (e.g., ChatGPT)
- **Improve discoverability** – Optimize how products appear in AI-powered search and recommendations

## Tech Stack

- **Frontend:** Bun, React, Tailwind CSS
- **Backend:** Rust (Actix)
- **Auth:** [Clerk](https://clerk.com) (organizations, sign-in, sign-up)
- **Database:** PostgreSQL

## Getting Started

### Quick start

```bash
bun install
cp .env.example .env
# Add your Clerk keys to .env (see below)
bun dev
```

### Setup

#### 1. Install dependencies

```bash
bun install
```

#### 2. Environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

**Clerk (required)**

Clawpify uses [Clerk](https://clerk.com) for authentication. Each person who runs the app needs their own Clerk application – there are no shared keys. Clerk's free tier includes 50,000 monthly users per app.

1. Go to [clerk.com](https://clerk.com) and sign up (free)
2. Create a new application in the [Clerk Dashboard](https://dashboard.clerk.com)
3. Go to **API Keys** and copy:
   - **Publishable key** (`pk_test_...`) → `BUN_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret key** (`sk_test_...`) → `CLERK_SECRET_KEY`
4. For local dev, Clerk allows `http://localhost:*` by default – no extra config needed
5. For production, add your domain to **Allowed redirect URLs** in Clerk Dashboard → Paths

| Variable | Required | Description |
|----------|----------|-------------|
| `CLERK_SECRET_KEY` | Yes | Clerk secret key ([Clerk Dashboard](https://dashboard.clerk.com) → API Keys) |
| `BUN_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key for the frontend |
| `RUST_API_URL` | No | Backend API URL (default: `http://127.0.0.1:3000`) |
| `PORT` | No | Server port (default: `3001`) |

**Backend (`backend/`)**

If using the Rust backend, copy `backend/.env.example` to `backend/.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g. `postgres://user:password@localhost:5432/clawpify`) |
| `OPENAI_API_KEY` | Yes | OpenAI API key for citation features |
| `OPENAI_PROMPT_MODEL` | No | Model for prompt/competitor generation (default: `gpt-4o-mini`) |
| `OPENAI_CITATION_MODEL` | No | Model for citation search with web search (default: `gpt-4o`) |
| `FIRECRAWL_API_KEY` | No | Firecrawl API key for better website scraping (optional) |

#### 3. Start development

```bash
bun dev
```

#### 4. Production

```bash
bun start
```

## Contact

Questions, feedback, or want to contribute? Reach out:

- **Email:** [alhwyn@alhwyn.com]
- **Twitter:** [@alhwyn](https://twitter.com/alhwynn)

## Contributing

We'd love your help. Whether it's code, docs, or ideas—every contribution matters.

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to contribute. Open an issue or PR anytime.

## License

Licensed under the MIT License – see [LICENSE](LICENSE) for details.
