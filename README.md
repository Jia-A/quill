<div align="center">

<img src="quill-frontend/public/quill-logo-circle.png" alt="Quill logo" width="120" />

# Quill

**A modern, Medium-inspired publishing platform for writers who love clean tools.**

Write. Publish. Share. Repeat.

[Features](#features) · [Tech Stack](#tech-stack) · [Architecture](#architecture) · [Project Structure](#project-structure) · [Getting Started](#getting-started) · [API](#api-reference)

</div>

---

## Overview

**Quill** is a full-stack blogging platform that pairs a polished Next.js reading and writing experience with a fast, serverless Hono API running on Cloudflare Workers. It ships with a rich Tiptap editor, NextAuth-based authentication (email/password **and** OAuth), author profiles, a Postgres data layer powered by Prisma Accelerate, and AI-generated social posts that turn a published article into a ready-to-share LinkedIn draft.

This is a **pnpm workspace** monorepo with two packages: `quill-frontend` (Next.js) and `quill-backend` (Hono on Cloudflare Workers).

## Features

### ✍️ Rich Writing Experience

- **Tiptap-powered editor** with headings, bold, italic, underline, highlights, text alignment, code blocks, and inline images.
- **Distraction-free writing** with a clean, focused composer UI.
- **Cover images & summaries** to make every post feel like a real publication.
- **Cloudinary-backed image uploads** — drag-drop or pick a file and it's uploaded to Cloudinary (via the backend `/image/upload` route), so posts reference hosted URLs rather than transient blobs.
- **Drafts & publishing** — save work in progress, publish when it's ready (publish date is set only when a post goes live).

### 🤖 AI Social Drafts

- **One-click LinkedIn drafts** generated from a post's title, content, and summary using **Cloudflare Workers AI** (`@cf/meta/llama-3.1-8b-instruct`).
- **Engagement-tuned prompt** — strong hooks, concrete examples, format/character limits, and an auto-included code snippet when the article has one.
- **Editable & regenerable** drafts, persisted per post + platform (`SocialDraft`), managed from a drafts panel in the editor.
- **Publish to LinkedIn** directly via connected-account OAuth.

### 📖 Beautiful Reading

- **Typography-first design** using Tailwind Typography for effortless readability.
- **Responsive layouts** and **Framer Motion** micro-interactions for an app-like feel.
- **Light/dark theme toggle** and a redesigned landing experience.
- **Per-author post listings** to binge a writer's work in one place.

### 👤 Author Profiles

- **Avatars, names, and bios** ("About the Author") attached to every post.
- **Profile pages** showcasing an author's published work.

### 🔐 Authentication

- **NextAuth (Auth.js v5)** sessions on the frontend.
- **Email/password** sign-up and sign-in, plus **OAuth** via GitHub, Google, and LinkedIn.
- **JWT** issued for the backend API; the same `JWT_SECRET` signs on the frontend and verifies on the backend.
- **Middleware-protected routes** so the editor and dashboard stay private.
- **Zod-validated** inputs on both client and server.

### 🛡️ Security

- **Hashed passwords** — passwords are hashed with **PBKDF2-HMAC-SHA256** (100k iterations, per-password salt) via the Web Crypto API, stored as a self-describing string and verified with a constant-time comparison. Plaintext passwords are never stored or returned. ([`lib/password.ts`](quill-backend/src/lib/password.ts))
- **Enforced password policy** — min 8 chars with a lowercase, uppercase, and a number, validated by Zod on the client and re-validated server-side (the API can't be bypassed by calling it directly).
- **Encrypted OAuth tokens at rest** — LinkedIn access tokens are encrypted with **AES-256-GCM** before they touch the database; the master key (`TOKEN_ENC_KEY`) lives only as a Worker secret, so a DB leak yields ciphertext, not usable credentials. ([`lib/crypto.ts`](quill-backend/src/lib/crypto.ts))
- **HTML sanitization (defense in depth)** — blog content is sanitized **on write** server-side with a strict allowlist (no `<script>`, no `on*` handlers, no `javascript:` URLs) using `ultrahtml`, and again **on render**: DOMPurify in client components, `ultrahtml` in the server-rendered blog page. ([`lib/sanitizeHtml.ts`](quill-backend/src/lib/sanitizeHtml.ts), [`utils/sanitize.ts`](quill-frontend/src/utils/sanitize.ts), [`utils/sanitizeServer.ts`](quill-frontend/src/utils/sanitizeServer.ts))
- **Public reads are scoped to published posts** — `GET /blog/bulk` filters on `published: true`, and password fields are stripped from every auth response.

### ⚡ Performance

- **Edge-fast API** — Hono on Cloudflare Workers for global, low-latency responses.
- **Prisma Accelerate** for cached, connection-pooled Postgres queries.
- **Next.js 16 App Router** with React 19 and SWR for snappy client navigation.

## Tech Stack

| Layer    | Stack                                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, Tiptap, SWR, Framer Motion, React Hook Form + Zod, NextAuth v5, DOMPurify      |
| Backend  | Hono, Cloudflare Workers, Prisma 7 + Accelerate, Wrangler, Workers AI, ultrahtml (sanitize), Web Crypto (hashing + encryption) |
| Database | PostgreSQL (via Prisma Accelerate)                                                                                             |
| Media    | Cloudinary (unsigned uploads via the backend `/image/upload` route)                                                            |
| Tooling  | pnpm workspaces, Husky + lint-staged, Prettier                                                                                 |

## Architecture

```mermaid
flowchart LR
    subgraph FE["quill-frontend · Next.js 16"]
        UI["App Router · React 19<br/>Tiptap editor · NextAuth"]
        Panel["SocialDraftsPanel"]
    end

    subgraph BE["quill-backend · Hono on Cloudflare Workers"]
        Routes["routes: user · blogs<br/>social · linkedin"]
    end

    UI -- "HTTPS / JSON<br/>(Bearer JWT)" --> Routes
    Routes -- "responses" --> UI

    Routes -- "persistence<br/>(Prisma + Accelerate)" --> DB[("PostgreSQL<br/>Post · SocialDraft · LinkedInAccount")]
    Routes -- "generate draft" --> AI["Workers AI<br/>Llama 3.1 8B"]
    Routes -- "publish (share)" --> LI["LinkedIn<br/>OAuth + Share API"]

    AI -- "draft text" --> Routes
    Routes -- "save as SocialDraft" --> DB
    Panel -. "edit, then publish" .-> Routes
```

## Project Structure

```
quill/                            # pnpm workspace root
├── package.json                  # workspace scripts (dev runs both apps)
├── pnpm-workspace.yaml
│
├── quill-frontend/               # Next.js App Router app
│   └── src/
│       ├── app/                  # Routes: /, /auth, /blogs, /blog/[id], /editor
│       │   └── api/auth/[...nextauth]/   # NextAuth route handler
│       ├── auth.ts               # NextAuth config (credentials + OAuth)
│       ├── actions/              # Server actions (authActions, socialActions)
│       ├── components/           # UI + feature components (OAuthButtons, SocialDraftsPanel, …)
│       ├── atoms/                # Small primitive components
│       ├── hooks/ · lib/ · utils/
│       ├── types/                # Shared + next-auth type augmentation
│       └── middleware.ts         # Route protection
│
└── quill-backend/                # Hono API on Cloudflare Workers
    ├── src/
    │   ├── index.ts              # App entrypoint, CORS, route mounts
    │   ├── routes/
    │   │   ├── user.ts           # signup / signin (hashed pw) / oauth-sync
    │   │   ├── blogs.ts          # CRUD for posts (content sanitized on write)
    │   │   ├── social.ts         # generate / read / update / delete / publish social drafts
    │   │   ├── linkedin.ts       # LinkedIn OAuth connect + callback (token encrypted)
    │   │   └── image.ts          # Cloudinary image upload proxy
    │   └── lib/                  # generateSocial, socialPrompt, stripHtml,
    │                             # password (PBKDF2), crypto (AES-GCM), sanitizeHtml
    ├── prisma/
    │   ├── schema.prisma         # User, Post, SocialDraft, LinkedInAccount
    │   └── migrations/
    └── wrangler.jsonc            # Cloudflare Worker config + AI binding
```

## Data Model

```prisma
model User {
  id              String           @id @default(cuid())
  email           String           @unique
  name            String?
  avatar          String?
  password        String?          // PBKDF2 hash (never plaintext); null for OAuth users
  aboutAuthor     String?
  posts           Post[]
  linkedinAccount LinkedInAccount?
}

model Post {
  id            String        @id @default(cuid())
  title         String
  content       String?
  image         String?
  summary       String?
  published     Boolean       @default(false)
  publishedDate DateTime?     @db.Date
  authorId      String
  author        User          @relation(fields: [authorId], references: [id])
  socialDrafts  SocialDraft[]
}

model SocialDraft {
  id        String   @id @default(cuid())
  postId    String
  platform  String                         // e.g. "linkedin"
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([postId, platform])
  @@index([postId])
}

model LinkedInAccount {
  id          String   @id @default(cuid())
  userId      String   @unique
  accessToken String   // AES-256-GCM encrypted at rest (decrypted only to call LinkedIn)
  expiresAt   DateTime
  linkedinUrn String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## Getting Started

### Prerequisites

- **Node.js 20+**
- **pnpm 9+** (the repo enforces pnpm via an `only-allow` preinstall hook — `npm install` will fail)
- A **PostgreSQL** database (Neon, Supabase, or any Postgres host)
- A **[Prisma Accelerate](https://www.prisma.io/data-platform/accelerate)** connection string
- A **Cloudflare account** (for the backend Worker + Workers AI)
- A **[Cloudinary](https://cloudinary.com)** account with an **unsigned upload preset** named `quill_unsigned` (for image uploads)
- OAuth app credentials for **GitHub**, **Google**, and **LinkedIn** (optional, for social sign-in / publishing)

### 1. Clone & install

From the repo root, a single install bootstraps both packages:

```bash
git clone <your-repo-url> quill
cd quill
pnpm install
```

> `postinstall` in the backend runs `prisma generate` automatically.

### 2. Configure the backend — `quill-backend`

Create `quill-backend/.dev.vars` (gitignored) for local Wrangler dev:

```ini
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=..."  # Accelerate URL
JWT_SECRET="a-long-random-secret"        # MUST match the frontend's AUTH_SECRET signing
TOKEN_ENC_KEY="a-separate-long-random-secret"   # AES-GCM key for encrypting OAuth tokens at rest
CLOUDINARY_CLOUD_NAME="your-cloud-name"  # for the /image/upload route (unsigned preset: quill_unsigned)
LINKEDIN_CLIENT_ID="..."                 # for publishing to LinkedIn
LINKEDIN_CLIENT_SECRET="..."
FRONTEND_URL="http://localhost:3000"     # optional (defaults to this)
BACKEND_URL="http://localhost:8787"      # optional (defaults to this)
```

Make sure the **Workers AI binding** is enabled in `quill-backend/wrangler.jsonc` (required for AI drafts):

```jsonc
"ai": {
  "binding": "AI"
}
```

Apply migrations:

```bash
cd quill-backend
pnpm prisma migrate deploy
```

### 3. Configure the frontend — `quill-frontend`

Create `quill-frontend/.env.local`:

```ini
NEXT_PUBLIC_API_URL="http://localhost:8787"   # backend Worker URL (exposed to the browser)

AUTH_SECRET="a-long-random-secret"            # NextAuth session secret (== backend JWT_SECRET)

# OAuth providers (optional)
AUTH_GITHUB_ID="..."
AUTH_GITHUB_SECRET="..."
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
AUTH_LINKEDIN_ID="..."
AUTH_LINKEDIN_SECRET="..."
```

### 4. Run everything

From the **repo root**, start both apps together:

```bash
pnpm dev
```

- Frontend → http://localhost:3000
- Backend → http://localhost:8787

Or run them individually: `pnpm dev:frontend` / `pnpm dev:backend`.

---

## Scripts

**Root** (`/`)

| Command                                  | What it does                        |
| ---------------------------------------- | ----------------------------------- |
| `pnpm dev`                               | Run frontend + backend concurrently |
| `pnpm dev:frontend` / `pnpm dev:backend` | Run one app                         |
| `pnpm build:frontend`                    | Production build of the frontend    |
| `pnpm deploy:backend`                    | Deploy the Worker                   |
| `pnpm lint`                              | Lint all packages                   |
| `pnpm format`                            | Prettier across the repo            |

**Backend** (`quill-backend/`)

| Command           | What it does                            |
| ----------------- | --------------------------------------- |
| `pnpm dev`        | Start the Worker locally with Wrangler  |
| `pnpm deploy`     | Deploy to Cloudflare Workers (minified) |
| `pnpm cf-typegen` | Regenerate Cloudflare binding types     |

**Frontend** (`quill-frontend/`)

| Command      | What it does               |
| ------------ | -------------------------- |
| `pnpm dev`   | Start Next.js in dev mode  |
| `pnpm build` | Production build           |
| `pnpm start` | Serve the production build |
| `pnpm lint`  | ESLint                     |

---

## API Reference

All routes are mounted under `/api/v1` and (except auth) expect an `Authorization: <JWT>` header.

| Method   | Path                                   | Description                                                         |
| -------- | -------------------------------------- | ------------------------------------------------------------------- |
| `POST`   | `/api/v1/user/signup`                  | Create an account (password hashed; policy enforced); returns a JWT |
| `POST`   | `/api/v1/user/signin`                  | Sign in (hash-verified), returns a JWT                              |
| `POST`   | `/api/v1/user/oauth-sync`              | Upsert a user from an OAuth provider, returns a JWT                 |
| `POST`   | `/api/v1/blog/`                        | Create a post (content sanitized on write)                          |
| `PUT`    | `/api/v1/blog/:id`                     | Update a post (content sanitized on write)                          |
| `GET`    | `/api/v1/blog/bulk`                    | List published posts                                                |
| `GET`    | `/api/v1/blog/single/:id`              | Read a post                                                         |
| `POST`   | `/api/v1/image/upload`                 | Upload an image to Cloudinary, returns `{ url }`                    |
| `GET`    | `/api/v1/social/:postId`               | Fetch the saved social draft for a post                             |
| `POST`   | `/api/v1/social/:postId/generate`      | Generate a draft via Workers AI (post must be published)            |
| `PUT`    | `/api/v1/social/:postId`               | Save an edited draft                                                |
| `POST`   | `/api/v1/social/:postId/publish`       | Publish the draft to LinkedIn (decrypts the stored token)           |
| `DELETE` | `/api/v1/social/:postId/:platform`     | Remove a draft                                                      |
| `GET`    | `/api/v1/linkedin/connect?token=<jwt>` | Start LinkedIn OAuth                                                |
| `GET`    | `/api/v1/linkedin/callback`            | OAuth callback (encrypts + stores the access token)                 |
| `GET`    | `/api/v1/linkedin/status`              | Whether the caller has a connected, unexpired LinkedIn account      |

> Ownership is enforced server-side: social/blog mutations return `403` for posts you don't own and `404` for missing posts. Publish returns `412` when LinkedIn isn't connected (or the stored token is expired/undecryptable).

---

## Deployment

- **Backend** → `cd quill-backend && pnpm deploy`. Set production secrets (not in `wrangler.jsonc`):
  ```bash
  npx wrangler secret put DATABASE_URL
  npx wrangler secret put JWT_SECRET
  npx wrangler secret put TOKEN_ENC_KEY
  npx wrangler secret put CLOUDINARY_CLOUD_NAME
  npx wrangler secret put LINKEDIN_CLIENT_ID
  npx wrangler secret put LINKEDIN_CLIENT_SECRET
  npx wrangler secret put FRONTEND_URL
  npx wrangler secret put BACKEND_URL
  ```
  Ensure the `AI` binding is present in `wrangler.jsonc`.
- **Frontend** → Deploy to Vercel, Cloudflare Pages, or any Node host. Set `NEXT_PUBLIC_API_URL` to the deployed Worker URL and configure `AUTH_SECRET` + OAuth provider secrets.

## Roadmap Ideas

- More social platforms (X/Bluesky) on top of the existing `SocialDraft` model
- Comments and reactions
- Tags and topic feeds
- Reading time estimates
- RSS feed per author

## License

MIT — do what you love with it.

---

<div align="center">
Built with 🧠 using Next.js, Hono, Prisma, Workers AI, and Cloudflare Workers.
</div>
