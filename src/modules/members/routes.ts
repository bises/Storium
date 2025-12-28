import bcrypt from 'bcrypt';
import { FastifyPluginAsync } from 'fastify';
import prisma from '../../db/prisma';
import { createMemberSchema, updateMemberSchema } from '../../schemas';

const memberRoutes: FastifyPluginAsync = async (server) => {
    // Register/Signup a new member (no space required)
    server.post('/', async (request, reply) => {
        const body = createMemberSchema.parse(request.body);

        // Check if email already exists
        const existing = await prisma.member.findUnique({
            where: { email: body.email },
        });

        if (existing) {
            return reply.code(409).send({
                success: false,
                error: {
                    code: 'EMAIL_ALREADY_EXISTS',
                    message: 'A member with this email already exists',
                },
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(body.password, 10);

        const member = await prisma.member.create({
            data: {
                name: body.name,
                email: body.email,
                password: hashedPassword,
            },
            select: {
                id: true,
                name: true,
                email: true,
                created_at: true,
                // Don't return password
            },
        });

        reply.code(201).send({
            success: true,
            data: member,
        });
    });

    // List all members (for admin purposes)
    server.get('/', async (request, reply) => {
        const { limit = 50, offset = 0 } = request.query as { limit?: number; offset?: number };

        const members = await prisma.member.findMany({
            take: Number(limit),
            skip: Number(offset),
            select: {
                id: true,
                name: true,
                email: true,
                created_at: true,
                updated_at: true,
                // Don't return password
            },
            orderBy: { created_at: 'desc' },
        });

        const total = await prisma.member.count();

        reply.send({
            success: true,
            data: members,
            pagination: {
                total,
                limit: Number(limit),
                offset: Number(offset),
            },
        });
    });

    // Add a member to a space (invite/join)
    server.post<{ Params: { spaceId: string } }>(
        '/:spaceId/members',
        async (request, reply) => {
            const { spaceId } = request.params;
            const { member_id, role } = request.body as { member_id: string; role?: string };

            // Verify space exists
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

            // Verify member exists
            const member = await prisma.member.findUnique({
                where: { id: member_id },
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

            // Check if already a member
            const existing = await prisma.spaceMembership.findUnique({
                where: {
                    member_id_space_id: {
                        member_id,
                        space_id: spaceId,
                    },
                },
            });

            if (existing) {
                return reply.code(409).send({
                    success: false,
                    error: {
                        code: 'ALREADY_MEMBER',
                        message: 'Member is already part of this space',
                    },
                });
            }

            // Add member to space
            const membership = await prisma.spaceMembership.create({
                data: {
                    member_id,
                    space_id: spaceId,
                    role: role || 'MEMBER',
                },
                include: {
                    member: {
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
                data: membership,
            });
        }
    );

    // List all members in a space
    server.get<{ Params: { spaceId: string } }>(
        '/:spaceId/members',
        async (request, reply) => {
            const { spaceId } = request.params;

            const memberships = await prisma.spaceMembership.findMany({
                where: { space_id: spaceId },
                include: {
                    member: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            created_at: true,
                        },
                    },
                },
                orderBy: { joined_at: 'desc' },
            });

            reply.send({
                success: true,
                data: memberships,
            });
        }
    );

    // Get a single member
    server.get<{ Params: { memberId: string } }>(
        '/:memberId',
        async (request, reply) => {
            const { memberId } = request.params;

            const member = await prisma.member.findUnique({
                where: { id: memberId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    created_at: true,
                    space_memberships: {
                        include: {
                            space: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
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

    // Update a member profile
    server.patch<{ Params: { memberId: string } }>(
        '/:memberId',
        async (request, reply) => {
            const { memberId } = request.params;
            const body = updateMemberSchema.parse(request.body);

            const member = await prisma.member.update({
                where: { id: memberId },
                data: body,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    updated_at: true,
                },
            });

            reply.send({
                success: true,
                data: member,
            });
        }
    );

    // Remove a member from a space
    server.delete<{ Params: { spaceId: string; memberId: string } }>(
        '/:spaceId/members/:memberId',
        async (request, reply) => {
            const { spaceId, memberId } = request.params;

            // Check if member is the owner
            const space = await prisma.space.findUnique({
                where: { id: spaceId },
            });

            if (space?.owner_id === memberId) {
                return reply.code(400).send({
                    success: false,
                    error: {
                        code: 'CANNOT_REMOVE_OWNER',
                        message: 'Cannot remove space owner from space',
                    },
                });
            }

            const deleted = await prisma.spaceMembership.delete({
                where: {
                    member_id_space_id: {
                        member_id: memberId,
                        space_id: spaceId,
                    },
                },
            });

            reply.code(204).send();
        }
    );
};

export default memberRoutes;
