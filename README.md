# Classroom

Gamified classroom platform: classrooms, announcements, boss-battle games,
an AI homework checker (voice Q&A) and a Discord tutoring bot that scores
participation.

| Path                  | What                                      | Stack                              |
| --------------------- | ----------------------------------------- | ---------------------------------- |
| `apps/server`         | REST + socket.io API (port 4000)          | NestJS 11 · Fastify 5 · Zod        |
| `apps/client`         | Web app (port 3000)                       | Next.js 15 (pages) · React 19      |
| `apps/assignment-bot` | AI homework generation & checking (8000)  | FastAPI · Typhoon · Gemini · Whisper |
| `apps/bot`            | Discord voice tutoring bot                | discord.py · Groq Whisper · Typhoon |
| `packages/db`         | Prisma schema, migrations, seed           | Prisma 7 · PostgreSQL 17           |
| `packages/auth`       | JWT + argon2id password hashing           |                                    |
| `packages/common`     | Auth middleware, guards, error filter     |                                    |
| `packages/config`     | Typed environment                         |                                    |

## Requirements

Node.js ≥ 22.12, pnpm 10, Docker (for Postgres), Python 3.10 for the bots.

## Getting started

```bash
cp .env.example .env                      # fill in ENTROPY, NEXTAUTH_SECRET, …
docker compose up -d db                   # Postgres on localhost:5435
pnpm install
pnpm build:package                        # builds packages + generates Prisma client
pnpm db:migrate:deploy                    # apply migrations
pnpm db:seed                              # starter data (see below)
pnpm dev                                  # API + web (+ Discord bot)
```

The Python services each have their own `.env` (see the `.env.example` next to
them) and virtualenv:

```bash
cd apps/assignment-bot && python3.10 -m venv .venv && .venv/bin/pip install -r requirements.txt
cd apps/bot            && python3.10 -m venv .venv && .venv/bin/pip install -r requirements.txt
```

`BOT_API_SECRET` must be identical in the root `.env` and both bot `.env` files.

## Starter data

`pnpm db:seed` creates (idempotently) a school, two classrooms (join codes
`DSA101`, `WEB201`), announcements, bosses, shop items, a game, a tutoring
session with a voice log, an AI-checked assignment with submissions,
attendance and a top-up transaction — at least one row in every table.

| Account                    | Role    | Password   |
| -------------------------- | ------- | ---------- |
| `jelegummy.jrs@gmail.com`  | TEACHER | `12345678` |
| `admin@classroom.local`    | ADMIN   | `12345678` |
| `student1-3@classroom.local` | STUDENT | `12345678` |

`pnpm db:seed --reset` deletes only the seed-owned records (fixed `5eed…` ids)
and recreates them. Existing users are never modified.

## Scripts

| Command                   | Purpose                                        |
| ------------------------- | ---------------------------------------------- |
| `pnpm dev`                | Run all apps in watch mode                     |
| `pnpm build`              | Production build of every package and app      |
| `pnpm typecheck`          | `tsc --noEmit` across the workspace            |
| `pnpm lint` / `pnpm fmt`  | ESLint 9 (flat config) / Prettier              |
| `pnpm test`               | Unit tests (Vitest)                            |
| `pnpm test:e2e`           | End-to-end API checks against a running server and seeded DB (modifies seed data — reset afterwards) |
| `pnpm db:migrate:dev`     | Create a migration from schema changes         |
| `pnpm db:studio`          | Prisma Studio                                  |

## Notes

- Bots authenticate to the API with the `x-bot-secret` header. Outside
  production the legacy default secret is still accepted so old setups keep
  working; set `BOT_API_SECRET` (required when `NODE_ENV=production`).
- Passwords are argon2id with per-user salts. Accounts created before this
  scheme still log in and are upgraded transparently on their next login.
- The homework checker records from the microphone and plays audio on the
  machine running `apps/assignment-bot`, so it is meant to run locally next to
  the student, not on a remote server.
