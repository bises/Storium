# Prisma Instructions

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
- Never put connection URLs in `schema.prisma`

Example `prisma.config.ts`:

```typescript
import { defineConfig } from "@prisma/client";

export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL!,
    },
  },
});
```

## SSL Certificate Handling

When working behind a corporate proxy with self-signed certificates, all Prisma CLI commands require SSL bypass:

```bash
# Generate Prisma Client
NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma generate

# Run migrations
NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma migrate dev

# Open Prisma Studio
NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma studio
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
