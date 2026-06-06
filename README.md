# MusicScholar

MusicScholar is an AI-powered music education platform that lets you upload music documents and sheet music, then ask natural language questions about music theory, harmony, rhythm, and composition. Answers are grounded in the uploaded content and cited back to the source.

**Live Demo:** https://music-scholar.vercel.app

| Service | URL |
|---|---|
| Frontend | https://music-scholar.vercel.app |
| Backend API | https://musicscholar-backend.onrender.com |

---

## What it does

- **Chat with your knowledge base** — Upload PDFs (textbooks, lecture notes, scores) and ask questions. The AI retrieves the most relevant passages and gives you a cited, grounded answer instead of guessing.
- **Sheet music analysis** — Upload a MusicXML or MIDI file and instantly get the key signature, time signature, chord progression, tempo markings, and suggested theory topics.
- **Sheet music viewer** — Renders uploaded scores directly in the browser using OpenSheetMusicDisplay.
- **Library browser** — Browse and manage all uploaded documents, filter by type, and delete what you no longer need.
- **Role-based access** — A single admin account manages uploads and the knowledge base. Regular users only see the Chat tab.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v4 |
| Backend | Node.js, Express (ESM) |
| Database | Neon PostgreSQL + pgvector |
| File storage | Cloudinary |
| Embeddings | Hugging Face (`all-MiniLM-L6-v2`) |
| LLM | Groq (`llama-3.3-70b-versatile`) |
| Sheet music parsing | Python microservice (music21, Flask) |
| Auth | JWT + bcrypt |
| Deployment | Render (backend + microservice), Vercel (frontend) |

---

## Project structure

```
musicscholar/
├── backend/               Node.js / Express API
│   └── src/
│       ├── routes/        upload, chat, knowledge, auth
│       ├── services/      chunker, embeddings, retrieval, groq, music21
│       ├── middleware/    JWT auth
│       └── scripts/       seed-admin, ingest, test-retrieval
├── frontend/              React + Vite + Tailwind
│   └── src/
│       ├── components/    ChatInterface, FileUpload, SheetMusicViewer, TopicBrowser, AudioAnalysis, LoginPage
│       └── context/       AuthContext
├── microservice/          Python Flask + music21
└── render.yaml            Render deployment config
```

---

## Getting started locally

### Prerequisites

- Node.js 18+
- Python 3.10+
- A [Neon](https://neon.tech) PostgreSQL database with `pgvector` enabled
- A [Cloudinary](https://cloudinary.com) account
- A [Hugging Face](https://huggingface.co) API token
- A [Groq](https://console.groq.com) API key

### 1. Database setup

Open the Neon SQL editor and run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source TEXT,
  type TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(384),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE chunks ADD COLUMN IF NOT EXISTS content_tsv TSVECTOR
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
CREATE INDEX ON chunks USING GIN (content_tsv);
CREATE INDEX ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  question TEXT,
  answer TEXT,
  sources JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Conversation',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  sources JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```
DATABASE_URL=your_neon_connection_string
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
HF_API_TOKEN=your_huggingface_token
GROQ_API_KEY=your_groq_key
MUSIC21_SERVICE_URL=http://localhost:5001
JWT_SECRET=change_this_to_a_long_random_string
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_admin_password
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

Seed the admin account (run once):

```bash
node src/scripts/seed-admin.js
```

Start the backend:

```bash
npm run dev
```

### 3. Python microservice

```bash
cd microservice
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # Mac / Linux
pip install -r requirements.txt
python app.py
```

The microservice runs on `http://localhost:5001`.

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Sign in with the admin credentials you set in `.env`.

---

## Deployment

The project is set up for one-click deployment on Render (backend + microservice) and Vercel (frontend).

**Render** — `render.yaml` at the project root defines both web services. Add all environment variables from the backend `.env` through the Render dashboard (never commit secrets).

**Vercel** — Import the `frontend/` folder. Set `VITE_API_BASE_URL` to your Render backend URL. Vercel automatically handles SPA routing via `vercel.json`.

Deployment order: microservice first → copy its URL → set as `MUSIC21_SERVICE_URL` for the backend → deploy backend → deploy frontend.

---

## Default accounts

| Role | Email | Password |
|---|---|---|
| Admin | set via `ADMIN_EMAIL` in `.env` | set via `ADMIN_PASSWORD` in `.env` |
| User | register from the login page | chosen at registration |

Admin can upload documents and manage the library. Regular users can only use the Chat tab.

---

## Environment variables reference

### Backend

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `HF_API_TOKEN` | Hugging Face token for embeddings |
| `GROQ_API_KEY` | Groq API key for LLM |
| `MUSIC21_SERVICE_URL` | URL of the Flask microservice |
| `JWT_SECRET` | Secret for signing JWTs (keep this private) |
| `ADMIN_EMAIL` | Email for the seeded admin account |
| `ADMIN_PASSWORD` | Password for the seeded admin account |
| `PORT` | Port the backend listens on (default 3001) |
| `FRONTEND_URL` | Allowed CORS origin |

### Frontend

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend URL (production only — dev uses the Vite proxy) |

---

## License

This project is for educational and personal use.
