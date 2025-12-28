import { FastifyPluginAsync } from 'fastify';
import prisma from '../../db/prisma';
import { createSpaceSchema, updateSpaceSchema } from '../../schemas';

const spaceRoutes: FastifyPluginAsync = async (server) => {
    // Create a space
    server.post('/', async (request, reply) => {
        const body = createSpaceSchema.parse(request.body);

        // Verify owner exists
        const owner = await prisma.member.findUnique({
            where: { id: body.owner_id },
        });

        if (!owner) {
            return reply.code(404).send({
                success: false,
                error: {
                    code: 'OWNER_NOT_FOUND',
                    message: 'Owner member not found',
                },
            });
        }

        // Create space and automatically add owner as ADMIN member
        const space = await prisma.space.create({
            data: {
                name: body.name,
                description: body.description,
                owner_id: body.owner_id,
                memberships: {
                    create: {
                        member_id: body.owner_id,
                        role: 'ADMIN',
                    },
                },
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        reply.code(201).send({
            success: true,
            data: space,
        });
    });

    // List all spaces
    server.get('/', async (request, reply) => {
        const { limit = 50, offset = 0 } = request.query as { limit?: number; offset?: number };

        const spaces = await prisma.space.findMany({
            take: Number(limit),
            skip: Number(offset),
            orderBy: { created_at: 'desc' },
        });

        reply.send({
            success: true,
            data: spaces,
        });
    });

    // Get a single space
    server.get<{ Params: { spaceId: string } }>('/:spaceId', async (request, reply) => {
        const { spaceId } = request.params;

        const space = await prisma.space.findUnique({
            where: { id: spaceId },
        });

        if (!space) {
            return reply.code(404).send({
                success: false,
                error: {
                    code: 'SPACE_NOT_FOUND',
                    message: 'Space not found',
                },
            });
        }

        reply.send({
            success: true,
            data: space,
        });
    });

    // Update a space
    server.patch<{ Params: { spaceId: string } }>('/:spaceId', async (request, reply) => {
        const { spaceId } = request.params;
        const body = updateSpaceSchema.parse(request.body);

        const space = await prisma.space.update({
            where: { id: spaceId },
            data: body,
        });

        reply.send({
            success: true,
            data: space,
        });
    });

    // Delete a space
    server.delete<{ Params: { spaceId: string } }>('/:spaceId', async (request, reply) => {
        const { spaceId } = request.params;

        await prisma.space.delete({
            where: { id: spaceId },
        });

        reply.code(204).send();
    });
};

export default spaceRoutes;
