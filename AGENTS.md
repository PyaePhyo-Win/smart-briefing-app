# Agent Instructions

Quick operating guide for AI coding agents in this repo. Keep deeper details in [README.md](README.md); do not duplicate large docs here.

## Project Overview

- Full stack app: FastAPI backend in `backend/` and Next.js frontend in `frontend/`.
- Backend runs AI research with CrewAI, search failover from Serper to DuckDuckGo, and Gemini report polishing.
- Frontend submits a research topic and renders streamed progress/report output.
- Main request path: `frontend/hooks/useResearchStream.ts` -> `POST /api/research/stream` -> `backend/api/research.py`.

## Commands

- Full Docker stack: `docker compose up --build`
- Backend dev: `cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && uvicorn main:app --reload --port 8000`
- Backend health check: `curl http://localhost:8000/`
- Frontend install/dev: `cd frontend && npm ci && npm run dev`
- Frontend build: `cd frontend && npm run build`
- Frontend lint: `cd frontend && npm run lint`
- No checked-in backend or frontend test scripts exist yet; do not invent test commands unless adding test tooling.

## Environment and Secrets

- Backend reads `backend/.env`; `GEMINI_API_KEY` is required at import/startup time.
- Optional backend env: `SERPER_API_KEY`, `CREW_LLM`, `POLISH_MODEL`, `ALLOWED_ORIGINS`, `MAX_CREW_WORKERS`, `LOG_LEVEL`.
- Frontend uses `NEXT_PUBLIC_API_URL`; the hook defaults to `http://localhost:8000` and Docker Compose sets the same value.
- Never commit real `.env` files, API keys, or secrets. Keep examples placeholder-only.

## Backend Boundaries

- App setup and CORS belong in `backend/main.py`.
- SSE/API behavior belongs in `backend/api/research.py`.
- CrewAI orchestration belongs in `backend/agents/crew_runner.py`.
- Search behavior belongs in `backend/tools/unified_search.py`.
- Polishing/stream helpers belong in `backend/services/`.
- Preserve the SSE wire format: JSON payloads emitted as `data: ...\n\n`.
- Preserve event types consumed by the frontend: `log`, `token`, `error`, and `done`.

## Frontend Boundaries

- Keep stream parsing, abort handling, and request lifecycle in `frontend/hooks/useResearchStream.ts`.
- Keep display UI in `frontend/components/` and page composition in `frontend/app/page.tsx`.
- Keep shared TypeScript types in `frontend/lib/types.ts`.
- Use `npm ci` for installs because `frontend/package-lock.json` is committed.

## Change Guidelines

- Before changing CORS, URLs, or ports, align `ALLOWED_ORIGINS`, `NEXT_PUBLIC_API_URL`, `docker-compose.yml`, and README examples.
- Do not break the backend/frontend SSE contract when refactoring either side.
- Prefer small, focused edits inside the existing file boundaries.
- Update documentation when commands, env vars, ports, or public API behavior changes.