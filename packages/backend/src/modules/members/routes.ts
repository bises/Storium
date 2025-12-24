import { FastifyPluginAsync } from 'fastify';
import prisma from '../../db/prisma';
import { createMemberSchema, updateMemberSchema } from '../../schemas';

const memberRoutes: FastifyPluginAsync = async (server) => {
    // Create a member
    server.post<{ Params: { spaceId: string } }>(
        '/:spaceId/members',
        async (request, reply) => {
            const { spaceId } = request.params;
            const body = createMemberSchema.parse(request.body);

            const member = await prisma.member.create({
                data: {
                    ...body,
                    space_id: spaceId,
                },
            });

            reply.code(201).send({
                success: true,
                data: member,
            });
        }
    );

    // List all members in a space
    server.get<{ Params: { spaceId: string } }>(
        '/:spaceId/members',
        async (request, reply) => {
            const { spaceId } = request.params;

            const members = await prisma.member.findMany({
                where: { space_id: spaceId },
                orderBy: { created_at: 'desc' },
            });

            reply.send({
                success: true,
                data: members,
            });
        }
    );

    // Get a single member
    server.get<{ Params: { spaceId: string; memberId: string } }>(
        '/:spaceId/members/:memberId',
        async (request, reply) => {
            const { spaceId, memberId } = request.params;

            const member = await prisma.member.findFirst({
                where: {
                    id: memberId,
                    space_id: spaceId,
                },
            });

            if (!member) {
                return reply.code(404).send({
                    success: false,
                    error: {
                        code: 'MEMBER_NOT_FOUND',
                        message: 'Member not found',
                    },
                });
            }

            reply.send({
                success: true,
                data: member,
            });
        }
    );

    // Update a member
    server.patch<{ Params: { spaceId: string; memberId: string } }>(
        '/:spaceId/members/:memberId',
        async (request, reply) => {
            const { spaceId, memberId } = request.params;
            const body = updateMemberSchema.parse(request.body);

            const member = await prisma.member.updateMany({
                where: {
                    id: memberId,
                    space_id: spaceId,
                },
                data: body,
            });

            if (member.count === 0) {
                return reply.code(404).send({
                    success: false,
                    error: {
                        code: 'MEMBER_NOT_FOUND',
                        message: 'Member not found',
                    },
                });
            }

            const updated = await prisma.member.findUnique({
                where: { id: memberId },
            });

            reply.send({
                success: true,
                data: updated,
            });
        }
    );

    // Delete a member
    server.delete<{ Params: { spaceId: string; memberId: string } }>(
        '/:spaceId/members/:memberId',
        async (request, reply) => {
            const { spaceId, memberId } = request.params;

            const deleted = await prisma.member.deleteMany({
                where: {
                    id: memberId,
                    space_id: spaceId,
                },
            });

            if (deleted.count === 0) {
                return reply.code(404).send({
                    success: false,
                    error: {
                        code: 'MEMBER_NOT_FOUND',
                        message: 'Member not found',
                    },
                });
            }

            reply.code(204).send();
        }
    );
};

export default memberRoutes;
