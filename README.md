# SmartGoals
 
[![CI](https://github.com/dawei41468/smartgoals/actions/workflows/ci.yml/badge.svg)](https://github.com/dawei41468/smartgoals/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![Python](https://img.shields.io/badge/python-%3E%3D3.11-blue)

SMART goals, task breakdown, and progress tracking. Frontend: React + TypeScript + Tailwind CSS v4 (Vite). Backend: FastAPI + MongoDB + JWT. Optional AI assistance via DeepSeek.

## Tech stack
- Frontend: React 18, TypeScript, Vite, Tailwind CSS v4
- Backend: FastAPI, Pydantic, Uvicorn
- Database: MongoDB (Motor)
- Auth: JWT (python-jose)
- Extras: APScheduler, Web Push, Email (SMTP), React Query, Radix UI

## Monorepo layout
```
/                    # repo root
├─ client/           # React app (Vite root)
├─ api/              # FastAPI app
│  ├─ main.py        # FastAPI entrypoint
│  ├─ routers/       # API routes: auth, goals, tasks, ai, ...
│  ├─ models.py      # Pydantic models
│  ├─ db.py          # MongoDB connection
│  ├─ config.py      # Settings & env
│  └─ requirements.txt
├─ docs/             # static docs (e.g., SMART goals reference)
├─ vite.config.ts    # Vite config (root=client, proxy /api to :8000)
└─ package.json
```

## Prerequisites
- Node.js ≥ 18
- Python ≥ 3.11
- MongoDB running locally or remotely

## Quick start (development)
1) Install backend deps
```
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r api/requirements.txt
```

2) Install frontend deps
```
npm install
```

3) Create environment file at repo root (.env)
The backend loads environment variables from the process env. Prefer a root `.env` so it is found regardless of the working directory.
```
# --- Core ---
ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/smartgoals
MONGODB_DB=smartgoals
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_MIN=10080
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# --- AI (optional) ---
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com

# --- Email (optional) ---
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_USE_TLS=true
EMAIL_FROM=

# --- Web Push (optional) ---
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@example.com
```
Note: `.env` is ignored by git (see .gitignore). Do not commit secrets.

4) Run everything
```
# runs FastAPI on :8000 and Vite on :5173
npm run dev
```
- Frontend: http://localhost:5173
- API docs (OpenAPI): http://127.0.0.1:8000/docs
- Vite dev server proxies calls to `/api/*` to the FastAPI server (see `vite.config.ts` -> `server.proxy`)

## NPM scripts
- `npm run dev` — start FastAPI (Uvicorn) and Vite concurrently
- `npm run api:dev` — start FastAPI with auto-reload on :8000
- `npm run api:start` — start FastAPI for production mode
- `npm run client:dev` — start Vite dev server
- `npm run build` — build the client to `dist/public`
- `npm start` — preview the built client locally on :5173

Tip: If `.venv` is not under the repo root, you can run Uvicorn manually:
```
uvicorn api.main:app --reload --port 8000
```

## Production
- Build client: `npm run build` (outputs to `dist/public`)
- Run API: `npm run api:start` (or a process manager like systemd/supervisor)
- Serve the built client from `dist/public` using your web server or a CDN
- Reverse proxy `/api` to the FastAPI server (default :8000)

## Features (high level)
- Goal creation and management (with draft saving)
- AI-assisted goal breakdown and regeneration (optional, via DeepSeek)
- Tasks, notifications (Web Push), and activity log
- Basic analytics and user settings

## Contributing
- Use TypeScript and follow existing patterns
- Keep components small and cohesive; avoid duplication
- Write tests for major functionality
- Do not commit `.env` or any credentials

## License
MIT
