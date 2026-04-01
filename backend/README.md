# Clawpify Backend

Rust API for the Clawpify consignment inventory tracker: listings, intake, LLM agents, activity logging, and subscribers.

## Setup

1. Create a `.env` file in the backend directory (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set `DATABASE_URL` (required).

2. Run migrations (from project root), e.g.:
   ```bash
   for f in migrations/*.sql; do psql "$DATABASE_URL" -f "$f" -v ON_ERROR_STOP=1; done
   ```

3. Optional: generate sqlx query cache for offline builds:
   ```bash
   cargo sqlx prepare
   ```

## OpenAI API Setup

`POST /api/llm/agents` and `POST /api/llm/agents/stream` require an OpenAI API key.

1. Set these in `backend/.env`:
   ```bash
   OPENAI_API_KEY=sk-...
   OPENAI_LLM_MODEL=gpt-5.2
   ```
   Notes:
   - `OPENAI_API_KEY` is required for LLM routes.
   - `OPENAI_LLM_MODEL` is optional; default is `gpt-5.2`.

2. Restart the backend after updating env vars.

3. Test the non-streaming endpoint:
   ```bash
   curl -s -X POST http://127.0.0.1:3000/api/llm/agents \
     -H 'Content-Type: application/json' \
     -H 'X-Internal-User-Id: cli-test' \
     -d '{
       "agents": [
         {
           "id": "a1",
           "provider": "openai",
           "prompt": "Say hi in one sentence.",
           "web_search": false
         }
       ]
     }'
   ```

If the key is missing/empty, the backend returns an error similar to:
`No LLM providers configured (set OPENAI_API_KEY)`.

## Tests

```bash
cargo test
```

## Logging

Set `RUST_LOG` to control tracing output. For OpenAI Responses stream event logs (debug):

```bash
RUST_LOG=backend=debug
```

## LLM agent streaming (NDJSON)

`POST /api/llm/agents/stream` returns `application/x-ndjson` (one JSON object per line). Requires the same internal auth header as `POST /api/llm/agents` (`X-Internal-User-Id`). Use `curl -N` so lines flush as they arrive:

```bash
curl -N -s -X POST http://127.0.0.1:3000/api/llm/agents/stream \
  -H 'Content-Type: application/json' \
  -H 'X-Internal-User-Id: cli-test' \
  -d '{"agents":[{"id":"a1","prompt":"Say hi in one sentence.","web_search":false}]}'
```

Optional: `RUST_LOG=backend=debug,llm.openai.stream=debug` for verbose OpenAI stream tracing.
