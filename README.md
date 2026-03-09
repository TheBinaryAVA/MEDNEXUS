# Backend Starter — Node.js + Express + TypeScript

Production-ready REST API starter covering prompts #20–#34.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill env
cp .env.example .env

# 3. Generate Prisma client + run migrations
npm run db:generate
npm run db:migrate        # creates tables

# 4. Seed the database
npm run db:seed

# 5. Start dev server (hot reload)
npm run dev               # → http://localhost:3000

# 6. View API docs (separate terminal)
npm run docs:serve        # → http://localhost:4000/docs
```

---

## File Tree

```
backend-starter/
├── prisma/
│   ├── schema.prisma         # DB schema + migrations source
│   └── seed.ts               # Dev seed data
├── src/
│   ├── config/
│   │   ├── index.ts          # Env config with validation
│   │   ├── database.ts       # Prisma singleton + connect/disconnect
│   │   └── logger.ts         # Pino structured logger
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── post.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts      # JWT authenticate + authorize(role)
│   │   ├── error.middleware.ts     # Global error handler + 404
│   │   ├── logging.middleware.ts   # Request ID + pino-http
│   │   ├── validate.middleware.ts  # express-validator wrapper
│   │   └── validators.ts           # Per-route validation chains
│   ├── repositories/
│   │   ├── user.repository.ts     # DB queries for users
│   │   └── post.repository.ts     # DB queries for posts (pagination, filters)
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   └── post.routes.ts
│   ├── services/
│   │   ├── auth.service.ts        # Hash, JWT, register, login, refresh
│   │   ├── post.service.ts        # Business logic + authz
│   │   └── upload.service.ts      # S3 presigned URL flow
│   ├── jobs/
│   │   └── email.job.ts           # BullMQ queue + worker
│   ├── types/
│   │   ├── index.ts               # DTOs, interfaces
│   │   └── errors.ts              # AppError hierarchy
│   ├── app.ts                     # Express app factory
│   └── index.ts                   # Bootstrap + graceful shutdown
├── tests/
│   ├── setup.ts                   # Global test setup + DB teardown
│   ├── unit/
│   │   └── auth.service.test.ts
│   └── integration/
│       └── posts.routes.test.ts
├── docs/
│   └── openapi.yaml               # Full OpenAPI 3.1 spec
├── scripts/
│   └── serve-docs.ts              # Swagger UI dev server
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── jest.config.ts
├── tsconfig.json
└── package.json
```

---

## Key Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Hot-reload dev server |
| `npm run build` | Compile TypeScript |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier write |
| `npm test` | All tests |
| `npm run test:unit` | Unit tests only |
| `npm run test:integration` | Integration tests (needs test DB) |
| `npm run test:coverage` | Coverage report |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed dev data |
| `npm run docs:serve` | Swagger UI on :4000 |

---

## Auth Flow

```
Register/Login → { accessToken (15m), refreshToken (cookie, 7d) }
         ↓
Authenticated request: Authorization: Bearer <accessToken>
         ↓
Token expiry → POST /auth/refresh (uses cookie) → new accessToken + rotated cookie
         ↓
Logout → revokes all refresh tokens for user
```

**Secure cookie settings:**
- `httpOnly: true` — not accessible by JS
- `secure: true` in production — HTTPS only
- `sameSite: strict` in production — CSRF protection
- `path: /api/v1/auth/refresh` — scoped to refresh endpoint only

---

## CRUD Contract

### Post endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/v1/posts` | — | Paginated, filterable, sortable |
| GET | `/api/v1/posts/:id` | — | Includes author |
| POST | `/api/v1/posts` | ✓ | Returns 201 |
| PATCH | `/api/v1/posts/:id` | ✓ | Requires `version` field (optimistic lock) |
| DELETE | `/api/v1/posts/:id` | ✓ | Soft delete; `?hard=true` for admins |

### Pagination response shape
```json
{
  "success": true,
  "data": [...],
  "meta": { "total": 42, "page": 1, "limit": 20, "totalPages": 3, "hasNext": true, "hasPrev": false }
}
```

---

## Security

| Feature | Implementation |
|---|---|
| Security headers | `helmet()` — sets X-Frame-Options, CSP, HSTS, etc. |
| CORS | Allowlist from `CORS_ORIGINS` env, `credentials: true` |
| Global rate limit | 100 req / 15 min per IP |
| Auth rate limit | 10 req / 15 min on `/auth/register` and `/auth/login` |
| Password hashing | bcrypt with configurable rounds (default 12) |
| JWT | Short-lived access (15m) + rotating refresh (7d) |
| Optimistic concurrency | `version` field on updates prevents lost-update anomaly |
| Soft delete | `deletedAt` timestamp — records stay for audit |

---

## Error Response Shape

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{ "field": "email", "msg": "Valid email required" }]
  }
}
```

Error codes: `VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | RATE_LIMITED | BAD_REQUEST | INTERNAL_ERROR`

---

## Log Format

```json
{
  "level": "info",
  "time": "12:34:56.789",
  "env": "development",
  "req": { "id": "abc-123", "method": "GET", "url": "/api/v1/posts", "userId": "u-1" },
  "res": { "statusCode": 200, "responseTime": 42 },
  "msg": "GET /api/v1/posts 200"
}
```

---

## Background Jobs (optional)

Requires Redis. Install BullMQ:
```bash
npm install bullmq ioredis
```

Start worker alongside server:
```ts
import { startEmailWorker } from './jobs/email.job';
startEmailWorker();
```

---

## File Uploads (optional)

Requires AWS SDK:
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Signed upload flow:
```
Client: POST /api/v1/uploads/presign  { mimeType: "image/png" }
Server: → { uploadUrl, fileKey, expiresIn }
Client: PUT <uploadUrl> (direct to S3, no server bandwidth)
Client: saves fileKey in your resource payload
```
