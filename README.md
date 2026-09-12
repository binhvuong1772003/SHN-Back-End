# SHN Back End

Backend API for the SHN shop management platform.

## Technology stack

- Node.js + TypeScript
- Express 5
- Prisma ORM + MongoDB
- Redis (cache, queues and short-lived locks)
- BullMQ workers
- Socket.IO
- Prometheus metrics
- Sentry error monitoring
- Cloudinary image storage

## Requirements

- Node.js 20+
- MongoDB replica set (required for Prisma transactions)
- Redis 6+

## Installation

```bash
npm install
```

Create an `.env` file from `.env.production.example` and configure at least:

```env
PORT=3000
DATABASE_URL="mongodb://localhost:27017/shn"
REDIS_URL="redis://localhost:6379"
JWT_ACCESS_SECRET="change-me"
JWT_REFRESH_SECRET="change-me"
```

Generate Prisma Client and synchronize the database schema:

```bash
npx prisma generate
npx prisma db push
```

If Prisma reports `EPERM` while replacing the Windows query engine, stop any running `npm run dev`/Node watcher and run the command again.

## Development

```bash
npm run dev
```

Run workers separately when needed:

```bash
npm run dev:worker
npm run dev:staff-invite-worker
```

## Production

```bash
npm run build
npm start
```

The server listens on `PORT` (default `3000`).

## API modules

Routes are mounted under `/api`:

- `/api/shops` – shop management, memberships and shop settings
- `/api/shops/:shopSlug/staff` – staff, schedules and off-day requests
- `/api/shops/:shopSlug/appointments` – booking and appointment lifecycle
- `/api/shops/:shopSlug/attendance` – check-in, check-out and attendance history
- `/api/shops/:shopSlug/services` – services, categories, options and packages
- `/api/shops/:shopSlug/payments` – payment management
- `/api/shops/:shopSlug/payrolls` – salary configuration and payroll
- `/api/shops/:shopSlug/reviews` – shop, staff and service review CRUD
- `/api/marketplace` – public shop, availability and review queries
- `/api/metrics` – Prometheus metrics

Authentication uses:

```http
Authorization: Bearer <accessToken>
```

## Response contract

Successful responses use:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Errors use:

```json
{
  "success": false,
  "error": {
    "code": "API_ERROR",
    "message": "Error message",
    "details": null
  }
}
```

## Project structure

```text
src/
  controller/       HTTP handlers
  service/          business logic
  route/            Express route definitions
  validation/       Zod request validation
  middleware/       authentication, authorization and errors
  cache/             Redis cache keys/invalidation
  jobs/              scheduled jobs
  workers/          BullMQ workers
  observability/    Sentry and Prometheus setup
prisma/
  schema.prisma     MongoDB data model
```

## Validation and checks

```bash
npx prisma validate
npx tsc --noEmit
npm run build
```

Review data is stored separately in `shop_reviews`, `staff_reviews` and `service_reviews`. Existing data in the legacy `reviews` collection must be migrated before it is removed from production.
