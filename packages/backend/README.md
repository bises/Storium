# Backend Development Guide

## Prerequisites

- Node.js (v18+)
- PostgreSQL database
- npm/pnpm package manager

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env` and update with your database credentials:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/home_inventory?schema=public"
JWT_SECRET="your-secret-key"
PORT=4000
NODE_ENV=development
```

### 3. Generate Prisma Client

**Important:** If you're behind a corporate proxy with self-signed certificates, use:

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma generate
```

For standard environments:

```bash
npx prisma generate
```

> **Note:** The `NODE_TLS_REJECT_UNAUTHORIZED=0` flag is only needed once to download Prisma engines. After the first successful generation, the engines are cached locally and you can run `npx prisma generate` normally.

### 4. Run Database Migrations

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma migrate dev --name init
```

### 5. Start Development Server

```bash
npm run dev
```

## Common Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Run production build
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma migrate dev` - Create and apply new migration
- `npx prisma generate` - Regenerate Prisma Client after schema changes

## API Documentation

Server runs on `http://localhost:4000`

- Health check: `GET /health`
- API docs: `GET /docs` (coming soon)

## Troubleshooting

### SSL Certificate Errors

If you encounter SSL certificate errors with Prisma CLI:

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma [command]
```

### Database Connection Issues

Verify your `DATABASE_URL` in `.env` is correct and PostgreSQL is running.

## Module System

This project uses **CommonJS** (`module: "CommonJS"` in tsconfig.json).

### Why CommonJS?

- ✅ No file extension confusion (`.js` not required in imports)
- ✅ Better Node.js compatibility out of the box
- ✅ Simpler setup and debugging
- ✅ Works seamlessly with Prisma and Fastify

### ES Modules vs CommonJS

**CommonJS (Current):**

```typescript
import express from "express";
import { myFunction } from "./myModule"; // No .js needed
```

**ES Modules (Alternative):**

```typescript
import express from "express";
import { myFunction } from "./myModule.js"; // .js required!
// Also requires "type": "module" in package.json
```

**Recommendation:** Stick with CommonJS for backend projects unless you have specific needs for ES Modules (tree-shaking, browser compatibility).
