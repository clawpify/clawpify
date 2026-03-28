# Clawpify

[![CI](https://github.com/clawpify/clawpify/actions/workflows/ci.yml/badge.svg)](https://github.com/clawpify/clawpify/actions/workflows/ci.yml)
[![Discord](https://img.shields.io/discord/1469593952330973227?label=discord&logo=discord)](https://discord.gg/Pqr6rk5HNg)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![GitHub stars](https://img.shields.io/github/stars/clawpify/clawpify)](https://github.com/clawpify/clawpify)
[![GitHub contributors](https://img.shields.io/github/contributors/clawpify/clawpify)](https://github.com/clawpify/clawpify/graphs/contributors)

**Open-source consignment store inventory tracker.**

Clawpify helps consignment and resale shops track inventory, listings, and store connections in one workspace—with auth, a Rust API, and optional AI helpers for day-to-day ops.

## What Clawpify Does

- **Inventory & listings** – Draft and manage consignment listings, photos, and status across your workflow
- **Connect your store** – Shopify and other platforms with Clerk organizations and workspace tools
- **AI agents** – Optional multi-agent LLM tasks via OpenAI (e.g. drafts and assistance)

## Tech Stack

- **Frontend:** Bun, React, Tailwind CSS
- **Backend:** Rust 
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
| `RUST_API_URL` | No | Rust API URL for the Bun server to proxy to (default: `http://127.0.0.1:3000`). **Required in production** if Rust runs in another process or host (e.g. Docker only runs Bun; set this to your Rust service URL). |
| `BUN_PUBLIC_API_BASE` | No | Public origin for browser `fetch` to `/api/*` (no trailing slash). Leave unset for same-origin. Set if the static SPA and API use different origins, or to point the waitlist at Rust directly (configure `CORS_ALLOWED_ORIGINS` on Rust). |
| `PORT` | No | Server port (default: `3001`) |
| `FIRECRAWL_API_KEY` | No | Firecrawl API key for website scraping (optional) |

**Backend (`backend/`)**

If using the Rust backend, copy `backend/.env.example` to `backend/.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g. `postgres://user:password@localhost:5432/clawpify`) |

#### 3. Start development

```bash
bun dev
```

#### 4. Production

```bash
bun start
```

#### 5. Database migrations (Railway)

If your database is on Railway, run migrations with the Railway CLI (uses `DATABASE_URL` from your project):

```bash
railway run bash -c 'for f in migrations/*.sql; do psql $DATABASE_URL -f $f -v ON_ERROR_STOP=1; done'
```

Or run each migration manually in order (`migrations/*.sql`).

## Contact

Questions, feedback, or want to contribute? Reach out:

- **Email:** [alhwyn@alhwyn.com]
- **Twitter:** [@alhwyn](https://twitter.com/alhwynn)

## Contributing

We'd love your help. Whether it's code, docs, or ideas—every contribution matters.

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to contribute. Open an issue or PR anytime.

## License

Licensed under the MIT License – see [LICENSE](LICENSE) for details.
