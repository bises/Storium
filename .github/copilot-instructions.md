# GitHub Copilot Custom Instructions

## Project Overview

This is a multi-user family home inventory application with Node.js/Fastify backend and PostgreSQL database using Prisma ORM.

## Technology Stack

- **Backend Framework**: Fastify (not Express)
- **Database**: PostgreSQL with Prisma 7.x
- **Authentication**: JWT tokens with bcrypt password hashing
- **Validation**: Zod schemas
- **Package Manager**: npm (pnpm workspace configured)

## Architecture Principles

- **Multi-tenant**: All data isolated by `household_id`
- **Hierarchical Locations**: Self-referencing location structure (House → Room → Container)
- **Multi-method Identifiers**: Support NFC tags, barcodes, QR codes, and manual labels
- **Audit Trails**: Track `created_by`, `updated_by`, `last_moved_by` on all entities
- **RESTful API**: Clean endpoint design with proper HTTP methods

## Development Guidelines

### Prisma Commands

When running Prisma commands behind a corporate proxy, always prefix with SSL bypass:

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma generate
NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma migrate dev
```

### Database Configuration

- Prisma 7 uses `prisma.config.ts` for datasource URLs (not `schema.prisma`)
- Schema file only contains `provider = "postgresql"` in datasource block
- Connection strings are managed in `prisma.config.ts`

### Code Style

- Use TypeScript strict mode
- Prefer async/await over callbacks
- Use Fastify plugins and decorators
- Implement proper error handling with custom error classes
- Use Zod for request validation
- Keep routes thin, business logic in services

### API Design

- All routes must check household membership for multi-tenant isolation
- Return full location paths for items (e.g., "House > Kitchen > Pantry")
- Support fuzzy search with performance < 1 second
- Scan resolution endpoint returns entity type + ID

### Security

- JWT tokens for authentication
- Password hashing with bcrypt (salt rounds: 10)
- Never expose password hashes in API responses
- Validate all user inputs with Zod schemas

## File Organization

```
packages/backend/
├── src/
│   ├── config/         # Configuration files
│   ├── db/             # Database client & migrations
│   ├── middleware/     # Auth, validation, error handling
│   ├── modules/        # Feature modules (auth, items, locations, etc.)
│   ├── types/          # TypeScript types
│   └── utils/          # Helper functions
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── prisma.config.ts # Database URL configuration
└── package.json
```

## Future Features to Support

- Offline sync capability
- Low-stock alerts
- Photo uploads
- CSV export
- Expiration date tracking
- Nested container depth limits
