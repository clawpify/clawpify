# Contributing to Clawpify

Thanks for your interest in contributing. Here's how to get started.

## Development Setup

1. **Clone and install**

   ```bash
   git clone https://github.com/YOUR_ORG/clawpify.git
   cd clawpify
   bun install
   ```

2. **Environment variables**

   - Copy `.env.example` to `.env` (root)
   - Copy `backend/.env.example` to `backend/.env` if running the backend
   - **Clerk:** Create a free app at [dashboard.clerk.com](https://dashboard.clerk.com) and add your publishable and secret keys to `.env`

3. **Run locally**

   ```bash
   bun dev
   ```

## Pull Requests

1. Open an issue first for larger changes
2. Fork, create a branch, make your changes
3. Run tests: `bun test:backend` (and `bun test:backend:integration` if applicable)
4. Open a PR with a clear description of the change

## Code Style

- Use the existing patterns in the codebase
- TypeScript/React for frontend, Rust for backend
- Prefer small, focused PRs
