# bun-react-template

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `CLERK_SECRET_KEY` | Yes | Clerk secret key for authentication ([Clerk Dashboard](https://dashboard.clerk.com) → API Keys) |
| `BUN_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key for the frontend |
| `RUST_API_URL` | No | Backend API URL (default: `http://127.0.0.1:3000`) |
| `PORT` | No | Server port (default: `3001`) |

**Backend** (`backend/`): If using the Rust backend, copy `backend/.env.example` to `backend/.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g. `postgres://user:password@localhost:5432/clawpify`) |
| `OPENAI_API_KEY` | Yes | OpenAI API key for citation features |
| `FIRECRAWL_API_KEY` | No | Firecrawl API key for better website scraping (optional) |

### 3. Start development

```bash
bun dev
```

### 4. Production

```bash
bun start
```

---

This project was created using `bun init` in bun v1.3.5. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
