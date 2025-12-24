# Backend Module Instructions

## Fastify Route Structure

Use Fastify's plugin system for organizing routes:

```typescript
import { FastifyPluginAsync } from "fastify";

const routes: FastifyPluginAsync = async (fastify) => {
  // Define routes here
  fastify.get("/endpoint", {
    schema: {
      // Validation schema
    },
    handler: async (request, reply) => {
      // Handler logic
    },
  });
};

export default routes;
```

## Authentication Middleware

Always use the auth decorator to protect routes:

```typescript
fastify.get("/protected", {
  preHandler: [fastify.authenticate],
  handler: async (request, reply) => {
    const userId = request.user.id;
    // Access authenticated user
  },
});
```

## Multi-tenant Data Isolation

Every database query for user data MUST filter by household_id:

```typescript
// ALWAYS include household_id in queries
const items = await prisma.item.findMany({
  where: {
    location: {
      household_id: request.user.household_id,
    },
  },
});
```

## Request Validation with Zod

Define Zod schemas for all request bodies:

```typescript
import { z } from "zod";

const createItemSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  quantity: z.number().int().min(0),
  location_id: z.string().cuid(),
});

// Use in route
fastify.post("/items", {
  schema: {
    body: zodToJsonSchema(createItemSchema),
  },
  handler: async (request, reply) => {
    const data = createItemSchema.parse(request.body);
    // data is now type-safe
  },
});
```

## Error Handling

Use custom error classes and global error handler:

```typescript
class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

// Throw in handlers
if (!item) {
  throw new NotFoundError("Item not found");
}
```

## Service Layer Pattern

Keep business logic in service files, routes stay thin:

```typescript
// services/item.service.ts
export class ItemService {
  async createItem(data: CreateItemDTO, userId: string) {
    // Business logic here
    return prisma.item.create({
      data: {
        ...data,
        created_by_id: userId,
      },
    });
  }
}

// routes/item.routes.ts
const itemService = new ItemService();
fastify.post("/items", async (request, reply) => {
  const item = await itemService.createItem(request.body, request.user.id);
  return { item };
});
```

## Response Format

Use consistent response structure:

```typescript
// Success
return {
  success: true,
  data: { item },
};

// Error (handled by error handler)
throw new ValidationError("Invalid input");
```
