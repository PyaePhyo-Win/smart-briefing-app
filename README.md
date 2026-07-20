# Smart Briefing App

AI-powered research briefing app with a decoupled FastAPI backend and Next.js frontend. The backend runs a CrewAI research workflow, searches the web with Serper or DuckDuckGo failover, stores users and conversations in PostgreSQL, indexes report chunks with Voyage AI embeddings in pgvector, compacts older chat turns into Gemini-generated conversation memory, and streams Gemini-polished Markdown plus follow-up chat responses to the UI in real time.

## Features

- **Research generation** powered by CrewAI agents, Gemini, and live web search.
- **Report polishing** with token-by-token Server-Sent Events (SSE) output.
- **Chat over saved reports or standalone conversations** with Voyage AI embeddings, pgvector retrieval, compressed conversation memory, and Gemini responses.
- **Persistent conversations** backed by PostgreSQL, including report/message history, vector chunks, and compacted chat summaries.
- **Email/password authentication** with HTTP-only database-backed session cookies.
- **Editable account profiles** with usernames, optional display names, MinIO-backed profile photos, and subscription-ready billing fields.
- **Credentialed security controls** including explicit CORS origins, unsafe-request origin checks, configurable trusted proxies, and endpoint rate limits backed by Redis in Docker Compose or an in-memory fallback locally.
- **Search failover** from Serper to DuckDuckGo when keys or upstream results are unavailable.
- **Next.js workspace UI** with authenticated routing, conversation history, settings/account page, responsive sidebars, theme toggle, language switching, and model selection.
- **Docker Compose** setup for frontend, backend, PostgreSQL, pgvector, Redis, and MinIO object storage.

## Architecture

```mermaid
flowchart TD
  A[User signs in] --> B[Next.js frontend]
  B -->|Cookie session| C[FastAPI auth endpoints]
  B -->|POST /api/research/stream| D[FastAPI research SSE endpoint]
  D --> E[CrewAI sequential crew]
  E --> F[Unified Search Engine]
  F --> G{SERPER_API_KEY set?}
  G -->|Yes| H[Serper.dev search]
  G -->|No or failed| I[DuckDuckGo search]
  H --> J[Research facts]
  I --> J
  J --> K[Technical Writer Markdown draft]
  K --> L[Gemini polish stream]
  L --> M[PostgreSQL report + messages]
  M --> N[Voyage embeddings -> pgvector]
  B -->|POST /api/chat/stream| O[FastAPI chat SSE endpoint]
  O --> P[RAG retrieval + chat summary + recent turns]
  P --> Q[Gemini follow-up answer]
  Q --> R[Persist assistant response]
  R --> S[Background chat compaction]
```

## Project Structure

```text
.
├── backend/
│   ├── main.py                  # FastAPI app setup and CORS
│   ├── config.py                # Environment-backed settings and validation
│   ├── alembic/                 # Database migrations
│   ├── api/                     # Auth, conversations, research, chat routes and dependencies
│   ├── agents/                  # CrewAI agent definitions and runner
│   ├── db/                      # SQLAlchemy models and session setup
│   ├── services/                # Auth, chat, compaction, object storage, RAG, polishing, streaming helpers
│   └── tools/                   # Unified search tool with Serper/DuckDuckGo fallback
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Authenticated workspace entry
│   │   ├── (auth)/              # Shared auth layout for login/register
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── conversations/[id]/  # Deep link into a saved conversation
│   │   └── settings/            # Account, profile, preferences, usage, credits, and billing views
│   ├── components/              # Workspace, auth, report, history, status, and UI components
│   │   ├── AuthLayout.tsx       # Split auth shell with hero image and controls
│   │   ├── AuthPage.tsx         # Login/register form
│   │   └── WorkspacePage.tsx    # Main research/chat shell
│   ├── hooks/                   # SSE stream hooks for research and chat
│   ├── lib/                     # API client, date/time helpers, i18n, shared types
│   └── public/images/           # Static UI assets such as auth-image.png
└── docker-compose.yml           # Frontend, backend, PostgreSQL, Redis, and MinIO stack
```

## Prerequisites

- Python 3.11+
- Node.js 20+
- A Gemini API key
- A Voyage AI API key
- Optional: a Serper.dev API key for Google-powered search
- Optional: Docker and Docker Compose

## Environment Variables

Create `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
VOYAGE_API_KEY=your_voyage_api_key
SERPER_API_KEY=your_serper_api_key_optional
DATABASE_URL=postgresql+psycopg://smart_briefing:smart_briefing@localhost:5432/smart_briefing
CREW_LLM=gemini/gemini-2.5-flash
POLISH_MODEL=gemini-3.5-flash
CHAT_MODEL=gemini-3.5-flash
ALLOWED_ORIGINS=http://localhost:3000
MAX_CREW_WORKERS=4
LOG_LEVEL=INFO
TRUSTED_PROXY_IPS=
RATE_LIMIT_MAX_KEYS=10000
REDIS_URL=
VOYAGE_EMBEDDING_MODEL=voyage-4
VOYAGE_EMBEDDING_DIMENSION=1024
RAG_TOP_K=6
RAG_CHUNK_SIZE=1800
RAG_CHUNK_OVERLAP=240
SESSION_COOKIE_NAME=smart_briefing_session
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_SAMESITE=lax
SESSION_EXPIRE_DAYS=30
OBJECT_STORAGE_ENDPOINT=http://localhost:9000
OBJECT_STORAGE_PUBLIC_URL=http://localhost:9000
OBJECT_STORAGE_BUCKET=profile-photos
OBJECT_STORAGE_ACCESS_KEY=minioadmin
OBJECT_STORAGE_SECRET_KEY=minioadmin
OBJECT_STORAGE_REGION=us-east-1
PROFILE_UPLOAD_MAX_BYTES=5242880
```

Frontend env is optional for local development because the hook defaults to the backend dev URL. Create `frontend/.env.local` if you need a different backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_PROFILE_IMAGE_HOST=localhost
NEXT_PUBLIC_PROFILE_IMAGE_PROTOCOL=http
```

### Backend Environment Variables

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Yes | - | Required at backend startup for Gemini/CrewAI generation. |
| `VOYAGE_API_KEY` | Yes | - | Required at backend startup for embeddings and RAG indexing. |
| `SERPER_API_KEY` | No | - | Enables Serper search before falling back to DuckDuckGo. |
| `DATABASE_URL` | No | `postgresql+psycopg://smart_briefing:smart_briefing@localhost:5432/smart_briefing` | SQLAlchemy/PostgreSQL connection string. |
| `CREW_LLM` | No | `gemini/gemini-2.5-flash` | CrewAI model identifier. |
| `POLISH_MODEL` | No | `gemini-3.5-flash` | Default Gemini model used for report polish streaming. Supported request overrides: `gemini-3.5-flash`, `gemini-3.1-flash-lite`, `gemini-2.5-flash`, `gemini-2.5-flash-lite`. |
| `CHAT_MODEL` | No | `gemini-3.5-flash` | Default Gemini model used for follow-up chat. Supported request overrides: `gemini-3.5-flash`, `gemini-3.1-flash-lite`, `gemini-2.5-flash`, `gemini-2.5-flash-lite`. |
| `ALLOWED_ORIGINS` | No | `http://localhost:3000` | Comma-separated credentialed CORS origins. Wildcard `*` is rejected. |
| `MAX_CREW_WORKERS` | No | `4` | Thread pool size for concurrent CrewAI runs. |
| `LOG_LEVEL` | No | `INFO` | Backend logging level. |
| `TRUSTED_PROXY_IPS` | No | empty | Comma-separated proxy IPs allowed to supply `X-Forwarded-For` client IPs. |
| `RATE_LIMIT_MAX_KEYS` | No | `10000` | Maximum in-memory rate-limit buckets; must be at least `1`. |
| `REDIS_URL` | No | empty | Optional Redis URL for rate limits shared across backend workers and containers. The in-memory limiter is used when unset or unavailable. |
| `VOYAGE_EMBEDDING_MODEL` | No | `voyage-4` | Embedding model for report chunks. |
| `VOYAGE_EMBEDDING_DIMENSION` | No | `1024` | Must remain `1024` to match the pgvector schema. |
| `RAG_TOP_K` | No | `6` | Number of relevant chunks retrieved for chat context. |
| `RAG_CHUNK_SIZE` | No | `1800` | Maximum report chunk size for indexing. |
| `RAG_CHUNK_OVERLAP` | No | `240` | Must be smaller than `RAG_CHUNK_SIZE`. |
| `SESSION_COOKIE_NAME` | No | `smart_briefing_session` | HTTP-only auth cookie name. |
| `SESSION_COOKIE_SECURE` | No | `false` | Set `true` for HTTPS deployments. Required when SameSite is `none`. |
| `SESSION_COOKIE_SAMESITE` | No | `lax` | One of `lax`, `strict`, or `none`. |
| `SESSION_EXPIRE_DAYS` | No | `30` | Session cookie and database session lifetime. |
| `OBJECT_STORAGE_ENDPOINT` | No | `http://localhost:9000` | S3-compatible API endpoint used by the backend for MinIO uploads and deletes. |
| `OBJECT_STORAGE_PUBLIC_URL` | No | `http://localhost:9000` | Public base URL used to build browser-facing profile photo URLs. |
| `OBJECT_STORAGE_BUCKET` | No | `profile-photos` | Bucket that stores user profile images. |
| `OBJECT_STORAGE_ACCESS_KEY` | No | `minioadmin` | MinIO or S3 access key. |
| `OBJECT_STORAGE_SECRET_KEY` | No | `minioadmin` | MinIO or S3 secret key. |
| `OBJECT_STORAGE_REGION` | No | `us-east-1` | S3-compatible region passed to the backend client. |
| `PROFILE_UPLOAD_MAX_BYTES` | No | `5242880` | Maximum accepted profile image size in bytes. |

## Local Development

### 1. Start the backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create and edit backend/.env first
alembic upgrade head
uvicorn main:app --reload --port 8000
```

Backend health check:

```bash
curl http://localhost:8000/
```

Expected response:

```json
{"status":"online","message":"Smart Briefing Agent Engine"}
```

### 2. Start the frontend

Open a second terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open <http://localhost:3000>, create an account, and start a research topic.

To validate the frontend without starting the dev server:

```bash
npm run lint
npm run build
```

## Docker Compose

Create `backend/.env` with the required `GEMINI_API_KEY` and `VOYAGE_API_KEY` values. From the repository root:

```bash
docker compose up --build
```

Services:

- Frontend: <http://localhost:3000>
- Backend: <http://localhost:8000>
- PostgreSQL: `localhost:5432`
- Redis: internal Docker network only (`redis://redis:6379/0` for the backend)
- MinIO API: <http://localhost:9000>
- MinIO Console: <http://localhost:9001>

The compose file mounts source directories for hot reload, reads backend secrets from `backend/.env`, starts PostgreSQL with pgvector, starts Redis for shared rate limits, provisions a public `profile-photos` bucket in MinIO, and runs `alembic upgrade head` before launching the backend.

## API

Base URL in local development: `http://localhost:8000`.

All authenticated browser requests use credentials and an HTTP-only session cookie. Unsafe methods (`POST`, `PUT`, `PATCH`, `DELETE`) validate the request `Origin` or `Referer` against `ALLOWED_ORIGINS`.

### Auth

- `POST /api/auth/register`
  - Body: `{ "email": "user@example.com", "password": "at least 8 chars" }`
  - Normalizes email by trimming and lowercasing.
  - Password length must be 8-1024 characters.
  - Returns `201` and sets the session cookie.
  - Duplicate email returns `409`.
  - Rate limit: 5 requests per 300 seconds per client/scope.
- `POST /api/auth/login`
  - Body: `{ "email": "user@example.com", "password": "..." }`
  - Invalid credentials return `401`.
  - Legacy bcrypt password hashes are upgraded to the current bcrypt-SHA256 format after a successful login.
  - Rate limit: 10 requests per 300 seconds per client/scope.
- `POST /api/auth/logout`
  - Clears the current database session and cookie.
- `GET /api/auth/me`
  - Returns the current authenticated user, or `401` when unauthenticated.
- `PATCH /api/auth/me/profile`
  - Body: `{ "username": "new_handle", "display_name": "Optional Name" }`
  - Usernames must be 3-32 characters and contain only letters, numbers, or underscores.
  - `display_name` may be set to `null` to clear it.
  - Returns the updated authenticated user.
  - Rate limit: 20 requests per 300 seconds per client/scope.
- `POST /api/auth/me/profile-photo`
  - Multipart form field: `file`
  - Accepts JPG, PNG, and WebP uploads up to `PROFILE_UPLOAD_MAX_BYTES`.
  - Stores the object in MinIO and returns the updated authenticated user.
  - Rate limit: 10 requests per 300 seconds per client/scope.
- `DELETE /api/auth/me/profile-photo`
  - Deletes the stored profile image reference and returns the updated authenticated user.
  - Rate limit: 10 requests per 300 seconds per client/scope.

Returned auth user fields now include:

- `username`
- `display_name`
- `profile_image_url`
- `plan`
- `subscription_status`
- `subscription_current_period_end`

Stripe billing is not implemented yet. The database now includes scaffold fields such as `stripe_customer_id` and `stripe_subscription_id` so future subscription work can build on the existing user schema.

### Conversations

- `GET /api/conversations`
- `GET /api/conversations/{conversation_id}`
- `DELETE /api/conversations/{conversation_id}`

### Research Stream

`POST /api/research/stream`

Body:

```json
{ "topic": "AI adoption in healthcare", "model": "gemini-3.5-flash", "conversation_id": null }
```

`model` is optional and controls report polishing only. If omitted, the backend uses `POLISH_MODEL`. Supported values are `gemini-3.5-flash`, `gemini-3.1-flash-lite`, `gemini-2.5-flash`, and `gemini-2.5-flash-lite`.

`conversation_id` is optional. When omitted or `null`, the backend creates a new research conversation titled from the topic. When provided, it appends the research request to an existing conversation owned by the authenticated user.

Validation and limits:

- Requires authentication.
- Provided `conversation_id` values require ownership of the conversation.
- `topic` is trimmed and must be 3-300 characters.
- Rate limit: 3 requests per 300 seconds per client/scope.

Response: `text/event-stream` where each message is emitted as `data: <json>\n\n`.

Event payloads consumed by the frontend:

- `log`: agent progress and status messages.
- `token`: streamed polished report text.
- `error`: generic user-safe error message.
- `done`: completion marker with `conversation_id`.

The backend creates the conversation before running research. If the request disconnects or research/polish/persistence fails before completion, the incomplete conversation is cleaned up.

### Chat Stream

`POST /api/chat/stream`

Body:

```json
{ "conversation_id": "uuid-or-null", "message": "Follow-up question", "model": "gemini-3.5-flash" }
```

`conversation_id` is optional. When omitted or `null`, the backend creates a new chat-only conversation titled from the message. When provided, it must belong to the authenticated user.

`model` is optional and controls direct Gemini chat responses. If omitted, the backend uses `CHAT_MODEL`. Supported values are `gemini-3.5-flash`, `gemini-3.1-flash-lite`, `gemini-2.5-flash`, and `gemini-2.5-flash-lite`.

Validation and limits:

- Requires authentication.
- Provided `conversation_id` values require ownership of the conversation.
- `message` is trimmed and must be 1-2000 characters.
- Rate limit: 12 requests per 300 seconds per client/scope.

Response: `text/event-stream` with:

- `token`: streamed assistant text.
- `error`: generic chat failure message.
- `done`: completion marker.

## Frontend Behavior

- Unauthenticated users are redirected to `/login`.
- Login and registration share the `(auth)` route group and `AuthLayout` split-screen shell.
- Auth pages include language and theme controls plus the `/images/auth-image.png` hero asset.
- The workspace loads the signed-in user, conversation summaries, and either the requested `/conversations/[id]` conversation or a blank state.
- Research mode creates a saved conversation and report; chat mode can continue the active conversation or create a new chat-only conversation.
- The composer supports model selection for research polish and chat responses.
- The conversation sidebar is collapsible/resizable on desktop and opens as an accessible mobile panel on small screens.
- The workspace header exposes language switching, theme toggling, settings, and logout.
- `/settings` verifies the session and links to account subpages for profile, preferences, usage, credits, and billing.
- `/settings/profile` supports username/display name edits and profile photo upload/removal.
- `/settings/preferences` exposes language and theme controls. Usage, credits, and billing pages are placeholders marked coming soon.

## Notes

- Keep `VOYAGE_EMBEDDING_DIMENSION=1024` unless you also create a matching database migration.
- Follow-up chat uses the latest raw chat turns plus compressed conversation memory once older chat messages exceed the backend sliding window.
- Do not use `ALLOWED_ORIGINS=*`; credentialed CORS and CSRF origin validation require explicit origins.
- If deploying cross-site cookies with `SESSION_COOKIE_SAMESITE=none`, set `SESSION_COOKIE_SECURE=true` and serve over HTTPS.
- Add real secrets only to local environment files or deployment secret stores. Do not commit `.env` files.
- Docker Compose reads backend secrets from `backend/.env`, uses Redis for shared rate limits, and runs `alembic upgrade head` before starting Uvicorn.
- PostgreSQL and MinIO data persist in Docker volumes.
