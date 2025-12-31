import { FastifyPluginAsync } from 'fastify';
import prisma from '../../db/prisma';
import type { Prisma } from '@prisma/client';
import { assignTagSchema, createTagSchema } from '../../schemas';

// Tag payload with _count include
type TagWithCount = Prisma.TagGetPayload<{
    include: { _count: { select: { item_tags: true } } };
}>;

const tagRoutes: FastifyPluginAsync = async (server) => {
    // Create a tag
    server.post<{ Params: { spaceId: string } }>(
        '/:spaceId/tags',
        async (request, reply) => {
            const { spaceId } = request.params;
            const body = createTagSchema.parse(request.body);

            const tag = await prisma.tag.create({
                data: {
                    ...body,
                    space_id: spaceId,
                },
            });

            reply.code(201).send({
                success: true,
                data: tag,
            });
        }
    );

    // List all tags in a space with item counts
    server.get<{ Params: { spaceId: string } }>(
        '/:spaceId/tags',
        async (request, reply) => {
            const { spaceId } = request.params;

            const tags: TagWithCount[] = await prisma.tag.findMany({
                where: { space_id: spaceId },
                include: {
                    _count: {
                        select: { item_tags: true },
                    },
                },
                orderBy: { created_at: 'desc' },
            });

            const tagsWithCount = tags.map((tag: TagWithCount) => ({
                id: tag.id,
                name: tag.name,
                color: tag.color,
                item_count: tag._count.item_tags,
                created_at: tag.created_at,
            }));

            reply.send({
                success: true,
                data: tagsWithCount,
            });
        }
    );

    // Delete a tag
    server.delete<{ Params: { spaceId: string; tagId: string } }>(
        '/:spaceId/tags/:tagId',
        async (request, reply) => {
            const { spaceId, tagId } = request.params;

            const deleted = await prisma.tag.deleteMany({
                where: {
                    id: tagId,
                    space_id: spaceId,
                },
            });

            if (deleted.count === 0) {
                return reply.code(404).send({
                    success: false,
                    error: {
                        code: 'TAG_NOT_FOUND',
                        message: 'Tag not found',
                    },
                });
            }

            reply.code(204).send();
        }
    );

    // Assign a tag to an item
    server.post<{ Params: { spaceId: string; itemId: string } }>(
        '/:spaceId/items/:itemId/tags',
        async (request, reply) => {
            const { spaceId, itemId } = request.params;
            const body = assignTagSchema.parse(request.body);

            // Verify item belongs to space
            const item = await prisma.item.findFirst({
                where: { id: itemId, space_id: spaceId },
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

            // Verify tag belongs to space
            const tag = await prisma.tag.findFirst({
                where: { id: body.tag_id, space_id: spaceId },
            });

            if (!tag) {
                return reply.code(404).send({
                    success: false,
                    error: {
                        code: 'TAG_NOT_FOUND',
                        message: 'Tag not found',
                    },
                });
            }

            const itemTag = await prisma.itemTag.create({
                data: {
                    item_id: itemId,
                    tag_id: body.tag_id,
                },
            });

            reply.code(201).send({
                success: true,
                data: itemTag,
            });
        }
    );

    // Remove a tag from an item
    server.delete<{ Params: { spaceId: string; itemId: string; tagId: string } }>(
        '/:spaceId/items/:itemId/tags/:tagId',
        async (request, reply) => {
            const { spaceId, itemId, tagId } = request.params;

            // Verify item belongs to space
            const item = await prisma.item.findFirst({
                where: { id: itemId, space_id: spaceId },
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

            await prisma.itemTag.delete({
                where: {
                    item_id_tag_id: {
                        item_id: itemId,
                        tag_id: tagId,
                    },
                },
            });

            reply.code(204).send();
        }
    );
};

export default tagRoutes;
