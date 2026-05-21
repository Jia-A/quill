<div align="center">

<p align="center">
  <img src="quill-frontend/public/Quill_logo.png" alt="Quill logo" width="160" />
</p>

# Quill

**A modern, Medium-inspired publishing platform for writers who love clean tools.**

Write. Publish. Read. Repeat.

[Features](#features) · [Screenshots](#screenshots) · [Tech Stack](#tech-stack) · [Architecture](#architecture) · [Project Structure](#project-structure) · [Getting Started](#getting-started)

</div>

---

## Overview

**Quill** is a full-stack blogging platform that pairs a polished Next.js reading and writing experience with a fast, serverless Hono API running on Cloudflare Workers. It ships with a rich Tiptap editor, JWT-based auth, author profiles, and a Postgres data layer powered by Prisma Accelerate — designed to feel as smooth as Medium, but yours to own.

## Features

### ✍️ Rich Writing Experience
- **Tiptap-powered editor** with headings, bold, italic, underline, highlights, and text alignment.
- **Distraction-free writing** with a clean, focused composer UI.
- **Cover images & summaries** to make every post feel like a real publication.
- **Drafts & publishing** — save your work in progress, publish when it's ready.

### 📖 Beautiful Reading
- **Typography-first design** using Tailwind Typography for effortless readability.
- **Responsive layouts** that look great from mobile to desktop.
- **Framer Motion micro-interactions** for a smooth, app-like feel.
- **Per-author post listings** to binge a writer's work in one place.

### 👤 Author Profiles
- **Avatars, names, and bios** ("About the Author") attached to every post.
- **Profile pages** showcasing an author's published work.

### 🔐 Authentication
- **Email/password sign-up and sign-in** with JWT-based sessions.
- **Middleware-protected routes** so the editor and dashboard stay private.
- **Form validation** end-to-end with React Hook Form + Zod.

### ⚡ Performance
- **Edge-fast API** — Hono on Cloudflare Workers means global, low-latency responses.
- **Prisma Accelerate** for cached, connection-pooled Postgres queries.
- **Next.js 16 App Router** with React 19 and SWR for snappy client navigation.

### 🛠 Developer Experience
- **Type-safe across the stack** — TypeScript everywhere, shared types via a common package.
- **Zod-validated inputs** on both client and server.
- **Prisma schema-driven** data layer with migrations checked in.
- **One-command deploys** to Cloudflare Workers.

## Screenshots

> _Coming soon — screenshots and demo videos will be added here._

<!-- ![Landing page](docs/landing.png) -->
<!-- ![Editor](docs/editor.png) -->
<!-- ![Reading view](docs/reading.png) -->

## Tech Stack

| Layer | Stack |
|------|-------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, Tiptap, SWR, Framer Motion, React Hook Form + Zod |
| Backend | Hono, Cloudflare Workers, Prisma 7 + Accelerate, Wrangler |
| Database | PostgreSQL (via Prisma Accelerate) |
| Shared | `@tech--tonic/medium-app-common` (validation schemas/types) |

## Architecture

```
┌──────────────────────┐        HTTPS / JSON        ┌─────────────────────────┐
│  quill-frontend      │  ───────────────────────►  │  quill-backend          │
│  Next.js 16 (App     │                            │  Hono on Cloudflare     │
│  Router) · React 19  │  ◄───────────────────────  │  Workers                │
│  Tiptap · Tailwind   │                            │  Prisma + Accelerate    │
└──────────────────────┘                            └───────────┬─────────────┘
                                                                │
                                                                ▼
                                                       ┌────────────────┐
                                                       │  PostgreSQL    │
                                                       └────────────────┘
```

## Project Structure

```
quill/
├── quill-frontend/           # Next.js App Router app
│   ├── src/
│   │   ├── app/              # Routes: /, /auth, /blogs, /blog/[id], /editor
│   │   ├── components/       # UI + feature components
│   │   ├── actions/          # Server actions
│   │   ├── hooks/            # Custom React hooks
│   │   ├── atoms/            # Small primitive components
│   │   ├── lib/ · utils/     # Helpers, API client, utilities
│   │   └── types/            # Shared TypeScript types
│   └── middleware.ts         # Route protection
│
└── quill-backend/            # Hono API on Cloudflare Workers
    ├── src/
    │   ├── index.ts          # App entrypoint
    │   └── routes/
    │       ├── user.ts       # signup / signin / profile
    │       └── blogs.ts      # CRUD for posts
    ├── prisma/
    │   ├── schema.prisma     # User & Post models
    │   └── migrations/
    └── wrangler.jsonc        # Cloudflare Worker config
```

## Data Model

```prisma
model User {
  id           String  @id @default(cuid())
  email        String  @unique
  name         String?
  avatar       String?
  password     String?
  aboutAuthor  String?
  posts        Post[]
}

model Post {
  id            String    @id @default(cuid())
  title         String
  content       String?
  image         String?
  summary       String?
  published     Boolean   @default(false)
  publishedDate DateTime? @db.Date
  authorId      String
  author        User      @relation(fields: [authorId], references: [id])
}
```

## Roadmap Ideas

- Comments and reactions
- Tags and topic feeds
- Image uploads via R2
- Reading time estimates
- RSS feed per author

---

## Getting Started

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 9+ (this repo uses pnpm workspaces)

> First-time setup: run `corepack enable` once on your machine. Node ships with Corepack, and this repo pins pnpm via the `packageManager` field in `package.json`, so Corepack will automatically use the correct pnpm version — no separate install required.
- A PostgreSQL database URL (Neon, Supabase, or any Postgres host)
- A [Prisma Accelerate](https://www.prisma.io/data-platform/accelerate) connection string
- A Cloudflare account (for deploying the backend)

### 1. Clone

```bash
git clone <your-repo-url> quill
cd quill
```

### 2. Install dependencies

From the repo root (pnpm will install for all workspaces):

```bash
pnpm install
```

### 3. Backend — `quill-backend`

```bash
cd quill-backend
```

Create a `.dev.vars` file for local Wrangler dev:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB"
ACCELERATE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=..."
JWT_SECRET="a-long-random-secret"
```

Generate the Prisma client and run migrations:

```bash
pnpm exec prisma generate --no-engine
pnpm exec prisma migrate deploy
```

Start the worker locally:

```bash
pnpm dev
```

The API will be available at `http://127.0.0.1:8787`.

### 4. Frontend — `quill-frontend`

```bash
cd ../quill-frontend
```

Create a `.env.local` file:

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8787
```

Run the dev server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and start writing.

### Scripts

**Frontend** (`quill-frontend/`)

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Start Next.js in dev mode |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint |

**Backend** (`quill-backend/`)

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Start the Worker locally with Wrangler |
| `pnpm deploy` | Deploy to Cloudflare Workers (minified) |
| `pnpm cf-typegen` | Regenerate Cloudflare binding types |

### Deployment

- **Backend** → `cd quill-backend && pnpm deploy` to ship the Worker. Set secrets with `pnpm exec wrangler secret put DATABASE_URL` / `ACCELERATE_URL` / `JWT_SECRET`.
- **Frontend** → Deploy to Vercel, Cloudflare Pages, or any Node host. Set `NEXT_PUBLIC_API_URL` to the deployed Worker URL.

## License

MIT — do what you love with it.

---

<div align="center">
Built with 🧠 using Next.js, Hono, Prisma, and Cloudflare Workers.
</div>
