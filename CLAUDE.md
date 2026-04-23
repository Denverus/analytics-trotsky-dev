# CLAUDE.md

This file provides guidance for Claude Code when working in this app.

Part of `console-trotsky-dev`. For cross-app context (other sub-repos, shared conventions, integration points), read `../CLAUDE.md` and `../.ai/`.

## App

`console-trotsky-dev-analytics-service` — Event ingestion and aggregation API. Receives analytics events from portfolio projects, stores them in MongoDB, and exposes aggregation endpoints for the console-ui dashboard.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Fastify 4.x
- **Database:** MongoDB Atlas via Mongoose or native driver
- **Auth:** API-key header (`X-Api-Key`) for write endpoints; admin JWT for read/aggregation endpoints
- **Testing:** Vitest + supertest (or Fastify inject)

## Project Setup

```bash
npm install
cp .env.example .env   # fill in MONGODB_URI, API_KEYS
```

## Commands

```bash
# Dev server (with hot reload)
npm run dev       # :3001

# Build
npm run build

# Run all tests
npm test

# Run a single test
npm test -- <pattern>

# Lint / format
npm run lint
```

## Architecture

### Folder structure

```
console-trotsky-dev-analytics-service/
├── src/
│   ├── routes/         # Fastify route handlers
│   ├── services/       # Business logic (aggregation queries, validation)
│   ├── plugins/        # Fastify plugins (auth, mongo, cors)
│   ├── schemas/        # JSON Schema for request validation
│   └── index.ts        # Entry point
├── test/
└── .env.example
```

### Key patterns

- Route → Service → MongoDB (no ORM layer — native driver or Mongoose, TBD at bootstrap)
- Fastify schema validation on every route (reject malformed events before they hit the DB)
- Auth plugin registered globally; routes opt-out rather than opt-in for write endpoints with API-key auth

### Event schema contract
Every inbound event must conform to:
```json
{
  "projectId": "string (required)",
  "eventName": "string (required)",
  "timestamp": "ISO 8601 string (required)",
  "sessionId": "string (required, anonymous — no PII)",
  "payload": "object (optional, freeform)"
}
```
**Never store IP addresses or any PII.** COPPA applies to Playzoo events.

### Configuration

- `.env` for all secrets — never committed
- `MONGODB_URI` — Atlas connection string
- `API_KEYS` — comma-separated project API keys (e.g. `playzoo=key1,world-of-ev=key2`)
- `JWT_SECRET` — for admin read endpoints
- `PORT` — default 3001

## Code Conventions

- TypeScript throughout
- Fastify schemas for all route inputs (no `any`)
- No PII in logs — scrub before logging
- Tests cover the happy path + schema validation rejection for every route

## Common Tasks

### Add a new event type
No schema migration needed — events are freeform in `payload`. Add a new aggregation query in `services/` and a new route in `routes/stats/`.

### Add a new aggregation endpoint
1. Add a service function in `src/services/stats.ts`
2. Add a route in `src/routes/stats/`
3. Add Fastify schema for the response shape
4. Add a test

## Important Notes

- **COPPA hard constraint:** Never store IP addresses, never log sessionId-to-user mappings, never store PII of any kind. This is non-negotiable — Playzoo's kids' site sends events here.
- MongoDB Atlas free tier is 512MB. Add a TTL index on the events collection (`timestamp`, expire after 90 days) before volume grows.
- Check `../.ai/TECH_DEBT.md` before flagging issues.
