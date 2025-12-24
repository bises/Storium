import { FastifyPluginAsync } from 'fastify';
import prisma from '../../db/prisma';

const movementHistoryRoutes: FastifyPluginAsync = async (server) => {
    // Get movement history for an item
    server.get<{
        Params: { spaceId: string; itemId: string };
        Querystring: { limit?: string; offset?: string };
    }>('/:spaceId/items/:itemId/history', async (request, reply) => {
        const { spaceId, itemId } = request.params;
        const limit = parseInt(request.query.limit || '50', 10);
        const offset = parseInt(request.query.offset || '0', 10);

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

        const history = await prisma.movementHistory.findMany({
            where: { item_id: itemId },
            include: {
                from_location: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                to_location: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                moved_by: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { moved_at: 'desc' },
            take: limit,
            skip: offset,
        });

        const total = await prisma.movementHistory.count({
            where: { item_id: itemId },
        });

        reply.send({
            success: true,
            data: history,
            pagination: {
                limit,
                offset,
                total,
            },
        });
    });

    // Get all movements in a space (admin view)
    server.get<{
        Params: { spaceId: string };
        Querystring: {
            limit?: string;
            offset?: string;
            location_id?: string;
            member_id?: string;
        };
    }>('/:spaceId/history', async (request, reply) => {
        const { spaceId } = request.params;
        const limit = parseInt(request.query.limit || '50', 10);
        const offset = parseInt(request.query.offset || '0', 10);

        const where: any = {
            item: {
                space_id: spaceId,
            },
        };

        // Filter by location (from or to)
        if (request.query.location_id) {
            where.OR = [
                { from_location_id: request.query.location_id },
                { to_location_id: request.query.location_id },
            ];
        }

        // Filter by member who moved
        if (request.query.member_id) {
            where.moved_by = request.query.member_id;
        }

        const history = await prisma.movementHistory.findMany({
            where,
            include: {
                item: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                from_location: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                to_location: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                moved_by: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { moved_at: 'desc' },
            take: limit,
            skip: offset,
        });

        const total = await prisma.movementHistory.count({ where });

        reply.send({
            success: true,
            data: history,
            pagination: {
                limit,
                offset,
                total,
            },
        });
    });
};

export default movementHistoryRoutes;
