# Prisma Instructions

## Project Structure

```
Storium/
├── .env                          # Database URL at root level
├── packages/
│   └── backend/
│       └── prisma/
│           ├── schema.prisma     # Database schema definition
│           ├── prisma.config.ts  # Prisma 7 configuration file
│           └── migrations/       # Migration history
│               └── YYYYMMDDHHMMSS_migration_name/
│                   └── migration.sql
```

**Important**: All Prisma commands must be run from the **root directory** and specify the schema/config paths.

## Prisma 7 Configuration

This project uses Prisma 7.x which has different configuration requirements than earlier versions.

### Schema File Structure

- The `schema.prisma` file should NOT contain `url` or `directUrl` in the datasource block
- Only specify `provider = "postgresql"` in the datasource

Example:

```prisma
datasource db {
  provider = "postgresql"
}
```

### Database URL Configuration

- Database connection strings are configured in `prisma/prisma.config.ts`
- The `.env` file must be at the **root level** (not in backend folder)
- Never put connection URLs in `schema.prisma`

Example `prisma.config.ts`:

```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

Example `.env` (at root):

```
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
```

## Prisma Commands

All commands must be run from the **root directory** with explicit schema and config paths.

### Generate Prisma Client

```bash
cd /path/to/Storium
npx prisma generate --schema ./packages/backend/prisma/schema.prisma
```

### Create and Apply Migration

```bash
cd /path/to/Storium
npx prisma migrate dev --name descriptive_name --schema ./packages/backend/prisma/schema.prisma --config ./prisma/prisma.config
```

### Open Prisma Studio

```bash
cd /path/to/Storium
npx prisma studio --config ./packages/backend/prisma/prisma.config.ts
```

### Reset Database (Development Only)

```bash
cd /path/to/Storium
npx prisma migrate reset --schema ./packages/backend/prisma/schema.prisma
```

**Warning**: `migrate reset` drops the entire database, re-runs all migrations, and regenerates Prisma Client. Only use when you have no production data.

## Resetting Migrations from Scratch

When you need to completely start over with migrations (e.g., major schema refactor with no data to preserve):

### Step 1: Delete the migrations folder

```bash
rm -rf packages/backend/prisma/migrations
```

### Step 2: Drop and recreate the database

```bash
# Option A: Using migrate reset (will prompt for confirmation)
npx prisma migrate reset --schema ./packages/backend/prisma/schema.prisma

# Option B: Manual database drop (if reset fails)
# Connect to PostgreSQL and run:
# DROP DATABASE storium_db;
# CREATE DATABASE storium_db;
```

### Step 3: Create a fresh initial migration

```bash
npx prisma migrate dev --name init_v1 --schema ./packages/backend/prisma/schema.prisma
```

This creates a clean migration history matching your current schema.

### When to Reset Migrations

✅ **Safe to reset when:**

- Working in development with no important data
- Major schema refactor (e.g., renaming core entities)
- Starting a new project version
- All team members can recreate their local databases

❌ **Never reset when:**

- Database contains production data
- Other developers have applied migrations you haven't
- Deployed to staging/production environments

## SSL Certificate Handling

When working behind a corporate proxy with self-signed certificates, Prisma CLI commands may require SSL bypass:

```bash
# Generate Prisma Client
NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma generate --schema ./packages/backend/prisma/schema.prisma

# Run migrations
NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma migrate dev --schema ./packages/backend/prisma/schema.prisma

# Open Prisma Studio
NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma studio --config ./packages/backend/prisma/prisma.config.ts
```

**Note**: This is only needed for CLI commands that download engines. Once engines are cached, this flag may not be necessary for subsequent runs.

## Schema Guidelines

- Use `cuid()` for primary keys (better than UUID for sorting)
- Always add indexes on foreign keys and frequently queried fields
- Use `@@map()` to specify table names in snake_case
- Document enums and complex relationships with comments
- Include audit fields: `created_at`, `updated_at`, `created_by_id`

## Migration Workflow

1. Update `schema.prisma`
2. Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma migrate dev --name descriptive_name`
3. Review generated SQL in `prisma/migrations/`
4. Commit both schema and migration files
