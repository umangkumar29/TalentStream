# TalentStream AI — Production System

Internal Intelligent Hiring & Resource Management System powered by RAG, pgvector, and GPT-4o.

---

## 📁 Project Structure

```
TalentStream/
├── .env.example              ← Root environment variables
├── docker-compose.yml        ← Postgres + FastAPI + Hasura orchestration
├── migrations/
│   └── 001_init.sql          ← Full schema with pgvector indexes & enums
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py           ← FastAPI entry point (CORS, routers)
│       ├── core/config.py    ← Pydantic settings from .env
│       ├── db/
│       │   ├── database.py   ← SQLAlchemy engine + session
│       │   └── models.py     ← ORM models (users, candidates, job_requests, job_matches)
│       ├── api/
│       │   ├── candidates.py ← POST /upload-resume, GET /candidates
│       │   ├── jobs.py       ← POST /jobs, GET /jobs, GET /jobs/{id}/matches, PATCH /matches/{id}/status
│       │   └── webhooks.py   ← POST /webhooks/process-match (Hasura Event Trigger)
│       └── services/
│           ├── azure_storage.py  ← Blob upload with local fallback
│           ├── openai_service.py ← Embeddings (text-embedding-3-small) + GPT-4o
│           ├── pdf_parser.py     ← PyMuPDF text extraction
│           └── rag_engine.py     ← 3-stage RAG: SQL filter → cosine pgvector → GPT-4o
├── hasura/
│   └── metadata/
│       ├── databases/default/tables/tables.yaml  ← RBAC for all 5 roles
│       └── event_triggers.yaml                   ← on_job_request_created trigger
└── frontend/
    ├── package.json          ← React 18, TypeScript, Apollo, Recharts, react-dropzone
    ├── vite.config.ts        ← Vite + path aliases + API proxy
    ├── tailwind.config.js    ← Custom TalentStream design tokens
    └── src/
        ├── main.tsx          ← React entry
        ├── App.tsx           ← Router + ApolloProvider
        ├── apollo.ts         ← HTTP + WebSocket (subscriptions) client
        ├── index.css         ← Tailwind + glass-card, btn-primary, badge-* styles
        ├── graphql/queries.ts← All GQL queries, mutations, subscriptions
        └── components/
            ├── Sidebar.tsx       ← NavLink navigation with active states
            ├── icons.tsx         ← Inline SVG icon components
            ├── UploadResumes.tsx ← RMG: react-dropzone bulk upload with per-file status
            ├── JobMatches.tsx    ← PM: JD form + live subscription match results
            └── VPDashboard.tsx   ← VP: Recharts bar + pie charts with KPI stat cards
```

---

## 🚀 Getting Started

### 1. Configure Environment

```bash
cp .env.example .env
# Fill in: OPENAI_API_KEY, AZURE_STORAGE_CONNECTION_STRING, HASURA SECRETS
```

```bash
cp frontend/.env.example frontend/.env
```

### 2. Start All Services (Docker)

```bash
docker-compose up --build
```

| Service  | URL                           |
|----------|-------------------------------|
| FastAPI  | http://localhost:8000/docs    |
| Hasura   | http://localhost:8080/console |
| Postgres | localhost:5432                |

### 3. Start Frontend Dev Server

```bash
cd frontend
npm run dev
# → http://localhost:5173
```

---

## 🔗 API Endpoints

| Method | Endpoint                              | Description                       |
|--------|---------------------------------------|-----------------------------------|
| POST   | `/api/v1/candidates/upload-resume`    | Upload & parse a PDF resume       |
| GET    | `/api/v1/candidates`                  | List all candidates                |
| POST   | `/api/v1/jobs`                        | Create a JD + trigger RAG         |
| GET    | `/api/v1/jobs`                        | List all job requests              |
| GET    | `/api/v1/jobs/{id}/matches`           | Get AI match results for a job    |
| PATCH  | `/api/v1/matches/{id}/status`         | Shortlist / Reject a candidate    |
| POST   | `/webhooks/process-match`             | Hasura Event Trigger endpoint     |

---

## 🧠 RAG Pipeline (3 Stages)

```
JD Created
    ↓
Stage 1: SQL filter → WHERE role_category = 'Developer'
    ↓
Stage 2: pgvector cosine_distance → ORDER BY embedding <=> jd_vector LIMIT 5
    ↓
Stage 3: GPT-4o → generates "Match Justification" for each result
    ↓
job_matches table updated → Hasura subscription push to frontend
```

---

## 🔐 RBAC (Hasura Roles)

| Role        | Candidates | Job Requests       | Job Matches              |
|-------------|------------|--------------------|--------------------------|
| Admin       | Full       | Full               | Full                     |
| VP          | Read       | Read (all)         | Read (all)               |
| Program Mgr | Read       | Read/Write (dept)  | Read                     |
| Project Mgr | Read       | Read/Write (own)   | Read/Write status (own)  |
| RMG         | Insert/Update | Read (titles)  | Read                     |
