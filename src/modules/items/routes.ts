import { FastifyPluginAsync } from 'fastify';
import prisma from '../../db/prisma';
import type { Prisma } from '@prisma/client';
import { createItemSchema, moveItemSchema, updateItemSchema } from '../../schemas';

// Precise item payload with includes
type ItemWithIncludes = Prisma.ItemGetPayload<{
    include: {
        location: true;
        item_tags: { include: { tag: true } };
    };
}>; 

// Payload type for item listing queries (location selected partially)
type ItemListPayload = Prisma.ItemGetPayload<{
    include: {
        location: { select: { id: true; name: true; parent_location_id: true } };
        item_tags: { include: { tag: { select: { id: true; name: true } } } };
    };
}>;

// Reuse location path helper
async function buildLocationPath(locationId: string): Promise<string> {
    const path: string[] = [];
    let currentId: string | null = locationId;

    while (currentId) {
        const location: { name: string; parent_location_id: string | null } | null = await prisma.location.findUnique({
            where: { id: currentId },
            select: { name: true, parent_location_id: true },
        });

        if (!location) break;

        path.unshift(location.name);
        currentId = location.parent_location_id;
    }

    return path.join(' / ');
}

const itemRoutes: FastifyPluginAsync = async (server) => {
    // Create an item
    server.post<{ Params: { spaceId: string } }>(
        '/:spaceId/items',
        async (request, reply) => {
            const { spaceId } = request.params;
            const body = createItemSchema.parse(request.body);

            const item = await prisma.item.create({
                data: {
                    ...body,
                    space_id: spaceId,
                },
            });

            reply.code(201).send({
                success: true,
                data: item,
            });
        }
    );

    // List all items in a space
    server.get<{ Params: { spaceId: string } }>(
        '/:spaceId/items',
        async (request, reply) => {
            const { spaceId } = request.params;
            const { location_id, tag_id, search, limit = 50, offset = 0 } = request.query as {
                location_id?: string;
                tag_id?: string;
                search?: string;
                limit?: number;
                offset?: number;
            };

            const where: any = { space_id: spaceId };
            if (location_id) where.location_id = location_id;
            if (search) {
                where.name = { contains: search, mode: 'insensitive' };
            }
            if (tag_id) {
                where.item_tags = {
                    some: { tag_id },
                };
            }

            const items: ItemListPayload[] = await prisma.item.findMany({
                where,
                take: Number(limit),
                skip: Number(offset),
                include: {
                    location: {
                        select: { id: true, name: true, parent_location_id: true },
                    },
                    item_tags: {
                        include: {
                            tag: {
                                select: { id: true, name: true },
                            },
                        },
                    },
                },
                orderBy: { created_at: 'desc' },
            });

            // Build paths and format response
            const itemsWithPaths = await Promise.all(
                items.map(async (item: ItemListPayload) => ({
                    ...item,
                    location: {
                        ...item.location,
                        path: await buildLocationPath(item.location_id),
                    },
                    tags: item.item_tags.map((it) => it.tag),
                    item_tags: undefined, // Remove join table data
                }))
            );

            const total = await prisma.item.count({ where });

            reply.send({
                success: true,
                data: itemsWithPaths,
                pagination: {
                    total,
                    limit: Number(limit),
                    offset: Number(offset),
                },
            });
        }
    );

    // Get a single item
    server.get<{ Params: { spaceId: string; itemId: string } }>(
        '/:spaceId/items/:itemId',
        async (request, reply) => {
            const { spaceId, itemId } = request.params;

            const item: ItemWithIncludes | null = await prisma.item.findFirst({
                where: {
                    id: itemId,
                    space_id: spaceId,
                },
                include: {
                    location: true,
                    item_tags: {
                        include: {
                            tag: true,
                        },
                    },
                    created_by: {
                        select: { id: true, name: true },
                    },
                },
            });

            if (!item) {
                return reply.code(404).send({
                    success: false,
                    error: {
                        code: 'ITEM_NOT_FOUND',
                        message: 'Item not found',
                    },
                });
            }

            const locationPath = await buildLocationPath(item.location_id);

            reply.send({
                success: true,
                data: {
                    ...item,
                    location: {
                        ...item.location,
                        path: locationPath,
                    },
                    tags: item.item_tags.map((it) => it.tag),
                    item_tags: undefined,
                },
            });
        }
    );

    // Scan for item by identifier
    server.get<{ Params: { spaceId: string; identifier: string } }>(
        '/:spaceId/items/scan/:identifier',
        async (request, reply) => {
            const { spaceId, identifier } = request.params;

            const item = await prisma.item.findFirst({
                where: {
                    space_id: spaceId,
                    OR: [{ item_reference_id: identifier }],
                },
                include: {
                    location: true,
                },
            });

            if (!item) {
                return reply.code(404).send({
                    success: false,
                    error: {
                        code: 'ITEM_NOT_FOUND',
                        message: 'Item not found with this identifier',
                    },
                });
            }

            const locationPath = await buildLocationPath(item.location.id);

            reply.send({
                success: true,
                data: {
                    id: item.id,
                    name: item.name,
                    location: {
                        path: locationPath,
                    },
                },
            });
        }
    );

    // Update an item
    server.patch<{ Params: { spaceId: string; itemId: string } }>(
        '/:spaceId/items/:itemId',
        async (request, reply) => {
            const { spaceId, itemId } = request.params;
            const body = updateItemSchema.parse(request.body);

            const item = await prisma.item.updateMany({
                where: {
                    id: itemId,
                    space_id: spaceId,
                },
                data: body,
            });

            if (item.count === 0) {
                return reply.code(404).send({
                    success: false,
                    error: {
                        code: 'ITEM_NOT_FOUND',
                        message: 'Item not found',
                    },
                });
            }

            const updated = await prisma.item.findUnique({
                where: { id: itemId },
            });

            reply.send({
                success: true,
                data: updated,
            });
        }
    );

    // Move an item to a different location
    server.post<{ Params: { spaceId: string; itemId: string } }>(
        '/:spaceId/items/:itemId/move',
        async (request, reply) => {
            const { spaceId, itemId } = request.params;
            const body = moveItemSchema.parse(request.body);

            // Get current item to track from_location
            const currentItem = await prisma.item.findFirst({
                where: {
                    id: itemId,
                    space_id: spaceId,
                },
            });

            if (!currentItem) {
                return reply.code(404).send({
                    success: false,
                    error: {
                        code: 'ITEM_NOT_FOUND',
                        message: 'Item not found',
                    },
                });
            }

            // Update item location and create movement history in transaction
            const [updatedItem] = await prisma.$transaction([
                prisma.item.update({
                    where: { id: itemId },
                    data: {
                        location_id: body.to_location_id,
                        last_moved_by_id: body.moved_by_id,
                    },
                }),
                prisma.movementHistory.create({
                    data: {
                        item_id: itemId,
                        from_location_id: currentItem.location_id,
                        to_location_id: body.to_location_id,
                        moved_by_id: body.moved_by_id,
                        notes: body.notes,
                    },
                }),
            ]);

            reply.send({
                success: true,
                data: updatedItem,
            });
        }
    );

    // Delete an item
    server.delete<{ Params: { spaceId: string; itemId: string } }>(
        '/:spaceId/items/:itemId',
        async (request, reply) => {
            const { spaceId, itemId } = request.params;

            const deleted = await prisma.item.deleteMany({
                where: {
                    id: itemId,
                    space_id: spaceId,
                },
            });

            if (deleted.count === 0) {
                return reply.code(404).send({
                    success: false,
                    error: {
                        code: 'ITEM_NOT_FOUND',
                        message: 'Item not found',
                    },
                });
            }

            reply.code(204).send();
        }
    );
};

export default itemRoutes;
