<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Prisma — migrations only

Use **migrations**, not `db push`, for normal schema changes so history stays in `prisma/migrations/` and deploys stay predictable.

- **Local (after editing `schema.prisma`):** `npm run db:migrate` (or `npx prisma migrate dev --name <short_name>`). This creates SQL, applies it, and runs `generate`.
- **CI / production:** `npm run db:migrate:deploy` after the app is built or before start.
- **Client only:** `npm run db:generate` if you only need an updated client.

Avoid `prisma db push` except rare one-off debugging; it bypasses migration files and can drift from what `migrate deploy` expects.

### If `migrate deploy` fails with **P3005** (database not empty, no migration history)

That means the DB already has tables (often from an earlier `db push`) but `_prisma_migrations` was never populated. This is **not** “production only” — it happens on any database that wasn’t created purely with Migrate.

**Option A — Baseline (keep data):** If the live schema already matches your migration chain, mark each folder under `prisma/migrations/` as applied without running SQL:

```bash
npx prisma migrate resolve --applied 20260324185912_init_vault_schema
# …repeat for every migration folder name, in chronological order…
```

Then `npm run db:migrate:deploy` should report no pending migrations. Only do this when you are sure the DB matches those migrations; otherwise use Option B.

**Option B — Reset (local, OK to wipe):** `npx prisma migrate reset` drops the database, reapplies all migrations from scratch, and runs seed (if configured).
