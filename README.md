# Smart Briefing — AI Research Agent

AI-powered research briefing app with a decoupled FastAPI backend and Next.js frontend. The backend runs a CrewAI research workflow, searches the web with Serper or DuckDuckGo failover, stores users and conversations in PostgreSQL, indexes report chunks with Voyage AI embeddings in pgvector, and streams Gemini-polished Markdown plus follow-up chat responses to the UI in real time.

## Features

- **Two-agent CrewAI workflow**
  - Senior Research Analyst gathers facts with a unified web search tool.
  - Technical Writer turns findings into structured Markdown.
- **Gemini polish pass** for clearer formatting, tone, and final report quality.
- **Account-backed sessions** with HTTP-only cookies and backend-owned conversation history.
- **PostgreSQL + pgvector persistence** for users, conversations, reports, and embeddings.
- **Voyage AI RAG retrieval** so report follow-up chat uses the most relevant indexed excerpts instead of the full report body.
- **Server-Sent Events (SSE)** for live agent logs and streamed report tokens.
- **Search failover** from Serper.dev to DuckDuckGo when Serper is unavailable or not configured.
- **Next.js dashboard** with auth, conversation history, live agent workspace, cancel support, and copy-to-clipboard.
- **Docker Compose support** for running frontend, backend, and PostgreSQL together.

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
  O --> P[RAG retrieval by user and conversation]
  P --> Q[Gemini follow-up answer]
```

## Project Structure

```text
smart-briefing-app/
├── docker-compose.yml
├── README.md
├── backend/
│   ├── main.py                    # FastAPI app, CORS, router registration
│   ├── config.py                  # Pydantic settings loaded from .env
│   ├── alembic/                   # Database migrations
│   ├── db/                        # SQLAlchemy models and session
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── api/
│   │   ├── auth.py                # Login, register, logout, current user
│   │   ├── conversations.py       # Conversation list/detail/delete
│   │   ├── chat.py                # POST /api/chat/stream SSE endpoint
│   │   └── research.py            # POST /api/research/stream SSE endpoint
│   ├── agents/
│   │   ├── analyst.py             # Senior Research Analyst agent
│   │   ├── writer.py              # Technical Writer agent
│   │   └── crew_runner.py         # CrewAI tasks and executor
│   ├── services/
│   │   ├── auth.py                # Password hashing and session storage
│   │   ├── chat.py                # Gemini chat prompt + stream
│   │   ├── polish.py              # Gemini streaming polish pass
│   │   ├── rag.py                 # Voyage embedding, chunking, retrieval
│   │   └── streaming.py           # CrewAI event bus -> SSE log events
│   └── tools/
│       └── unified_search.py      # Serper -> DuckDuckGo failover search
└── frontend/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── globals.css
    ├── components/
    │   ├── AgentLogPanel.tsx
    │   ├── ConversationComposer.tsx
    │   ├── ConversationHistorySidebar.tsx
    │   ├── ConversationPanel.tsx
    │   └── StatusBar.tsx
    ├── hooks/
    │   ├── useChatStream.ts       # Chat SSE parser + abort logic
    │   └── useResearchStream.ts   # Research SSE parser + abort logic
    ├── lib/
    │   ├── api.ts                 # Backend auth/conversation client
    │   └── types.ts
    ├── package.json
    └── Dockerfile
```

## Prerequisites

- Python 3.11+
- Node.js 20+
- A Gemini API key
- A Voyage AI API key
- Optional: a Serper.dev API key for Google-powered search
- Optional: Docker and Docker Compose

## Environment Variables

Create `backend/.env` before starting the backend.

```env
GEMINI_API_KEY=your-gemini-api-key
VOYAGE_API_KEY=your-voyage-api-key
SERPER_API_KEY=your-serper-api-key-optional
DATABASE_URL=postgresql+psycopg://smart_briefing:smart_briefing@localhost:5432/smart_briefing
CREW_LLM=gemini/gemini-2.5-flash
POLISH_MODEL=gemini-2.5-flash
ALLOWED_ORIGINS=http://localhost:3000
MAX_CREW_WORKERS=4
LOG_LEVEL=INFO
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_SAMESITE=lax
```

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Yes | — | Used by CrewAI's Gemini LLM and the final polish stream. |
| `VOYAGE_API_KEY` | Yes | — | Used to embed report chunks and follow-up chat queries for RAG retrieval. |
| `SERPER_API_KEY` | No | empty | Enables Serper.dev search. If missing or failing, DuckDuckGo is used. |
| `DATABASE_URL` | Yes | — | SQLAlchemy connection string for PostgreSQL. |
| `CREW_LLM` | No | `gemini/gemini-2.5-flash` | CrewAI LLM identifier for the analyst and writer agents. |
| `POLISH_MODEL` | No | `gemini-2.5-flash` | Gemini model used for the final Markdown polish pass. |
| `ALLOWED_ORIGINS` | No | `http://localhost:3000` | Comma-separated CORS origins. |
| `MAX_CREW_WORKERS` | No | `4` | Shared thread-pool size for concurrent crew runs. |
| `LOG_LEVEL` | No | `INFO` | Backend logging level. |
| `SESSION_COOKIE_SECURE` | No | `false` | Use `true` behind HTTPS in production. |
| `SESSION_COOKIE_SAMESITE` | No | `lax` | Cookie SameSite policy for auth sessions. |

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

## Docker Compose

From the repository root:

```bash
docker compose up --build
```

Services:

- Frontend: <http://localhost:3000>
- Backend: <http://localhost:8000>
- PostgreSQL: `localhost:5432`

The compose file mounts source directories for hot reload, reads backend secrets from `backend/.env`, starts PostgreSQL with pgvector, and runs `alembic upgrade head` before launching the backend.

## API

### Auth endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Sessions are stored in the database and sent through the `smart_briefing_session` HTTP-only cookie.

### Conversation endpoints

- `GET /api/conversations`
- `GET /api/conversations/{conversation_id}`
- `DELETE /api/conversations/{conversation_id}`

### `POST /api/research/stream`

Starts a research run for the authenticated user, creates a new conversation, and returns an SSE stream.

Request body:

```json
{
  "topic": "Quantum computing in 2026"
}
```

Validation:

- `topic` is trimmed.
- Minimum length: 3 characters.
- Maximum length: 300 characters.

### SSE Events

Each event is emitted as a `data:` JSON payload.

#### Agent log event

```text
data: {"type":"log","agent":"System","event":"status","message":"Starting crew research..."}
```

#### Report token event

```text
data: {"type":"token","text":"## Introduction\n\n..."}
```

#### Done event

```text
data: {"type":"done","conversation_id":"..."}
```

#### Error event

```text
data: {"type":"error","message":"Research agent failed: ..."}
```

| Event type | Description |
| --- | --- |
| `log` | Live CrewAI activity, including task, agent, reasoning, and tool events. |
| `token` | A streamed chunk of the polished Markdown report. |
| `done` | The stream completed successfully and includes the created `conversation_id`. |
| `error` | The backend failed during research or polish. |

### `POST /api/chat/stream`

Streams a follow-up assistant response for an existing conversation.

Request body:

```json
{
  "conversation_id": "uuid",
  "message": "What are the biggest risks in this report?"
}
```

The backend retrieves the most relevant indexed report chunks for that user and conversation, then passes only those excerpts plus recent chat history to Gemini.

## Frontend Behavior

The UI displays:

1. **Account sign-in** before loading backend conversation history.
2. **Connecting to engine...** while the research POST request is opening.
3. **Agent research in progress** while CrewAI runs and log events arrive.
4. **Generating final report** while Gemini streams Markdown tokens.
5. **Report Complete** when the `done` event arrives, after which the conversation becomes available for follow-up chat.

Users can cancel an in-progress request. The backend also checks for client disconnects to avoid wasting LLM tokens.

## Notes

- The backend endpoint is `/api/research/stream`, not `/api/research`.
- Follow-up chat uses `/api/chat/stream` and requires an authenticated conversation id.
- The frontend reads `NEXT_PUBLIC_API_URL`; if omitted, it defaults to `http://localhost:8000`.
- Conversation history is now loaded from the backend database instead of browser local storage.
- Serper is optional. DuckDuckGo fallback requires no API key.
- CrewAI tracing is disabled in `run_crew()` by default.
