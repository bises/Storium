import { FastifyPluginAsync } from 'fastify';
import prisma from '../../db/prisma';
import { createLocationSchema, updateLocationSchema } from '../../schemas';

// Helper function to build location path
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

const locationRoutes: FastifyPluginAsync = async (server) => {
    // Create a location
    server.post<{ Params: { spaceId: string } }>(
        '/:spaceId/locations',
        async (request, reply) => {
            const { spaceId } = request.params;
            const body = createLocationSchema.parse(request.body);

            const location = await prisma.location.create({
                data: {
                    ...body,
                    space_id: spaceId,
                },
            });

            reply.code(201).send({
                success: true,
                data: location,
            });
        }
    );

    // List all locations in a space
    server.get<{ Params: { spaceId: string } }>(
        '/:spaceId/locations',
        async (request, reply) => {
            const { spaceId } = request.params;
            const { parent_location_id, location_type } = request.query as {
                parent_location_id?: string;
                location_type?: string;
            };

            const where: any = { space_id: spaceId };
            if (parent_location_id) where.parent_location_id = parent_location_id;
            if (location_type) where.location_type = location_type;

            const locations = await prisma.location.findMany({
                where,
                orderBy: { created_at: 'desc' },
            });

            // Build paths for each location
            const locationsWithPaths = await Promise.all(
                locations.map(async (loc) => ({
                    ...loc,
                    path: await buildLocationPath(loc.id),
                }))
            );

            reply.send({
                success: true,
                data: locationsWithPaths,
            });
        }
    );

    // Get a single location with path
    server.get<{ Params: { spaceId: string; locationId: string } }>(
        '/:spaceId/locations/:locationId',
        async (request, reply) => {
            const { spaceId, locationId } = request.params;

            const location = await prisma.location.findFirst({
                where: {
                    id: locationId,
                    space_id: spaceId,
                },
                include: {
                    created_by: {
                        select: { id: true, name: true },
                    },
                },
            });

            if (!location) {
                return reply.code(404).send({
                    success: false,
                    error: {
                        code: 'LOCATION_NOT_FOUND',
                        message: 'Location not found',
                    },
                });
            }

            const path = await buildLocationPath(location.id);

            reply.send({
                success: true,
                data: {
                    ...location,
                    path,
                },
            });
        }
    );

    // Scan for location by identifier
    server.get<{ Params: { spaceId: string; identifier: string } }>(
        '/:spaceId/locations/scan/:identifier',
        async (request, reply) => {
            const { spaceId, identifier } = request.params;

            const location = await prisma.location.findFirst({
                where: {
                    space_id: spaceId,
                    OR: [{ nfc_tag: identifier }, { qr_code: identifier }, { barcode: identifier }],
                },
            });

            if (!location) {
                return reply.code(404).send({
                    success: false,
                    error: {
                        code: 'LOCATION_NOT_FOUND',
                        message: 'Location not found with this identifier',
                    },
                });
            }

            const path = await buildLocationPath(location.id);

            reply.send({
                success: true,
                data: {
                    id: location.id,
                    name: location.name,
                    path,
                    location_type: location.location_type,
                },
            });
        }
    );

    // Update a location
    server.patch<{ Params: { spaceId: string; locationId: string } }>(
        '/:spaceId/locations/:locationId',
        async (request, reply) => {
            const { spaceId, locationId } = request.params;
            const body = updateLocationSchema.parse(request.body);

            const location = await prisma.location.updateMany({
                where: {
                    id: locationId,
                    space_id: spaceId,
                },
                data: body,
            });

            if (location.count === 0) {
                return reply.code(404).send({
                    success: false,
                    error: {
                        code: 'LOCATION_NOT_FOUND',
                        message: 'Location not found',
                    },
                });
            }

            const updated = await prisma.location.findUnique({
                where: { id: locationId },
            });

            reply.send({
                success: true,
                data: updated,
            });
        }
    );

    // Delete a location
    server.delete<{ Params: { spaceId: string; locationId: string } }>(
        '/:spaceId/locations/:locationId',
        async (request, reply) => {
            const { spaceId, locationId } = request.params;

            const deleted = await prisma.location.deleteMany({
                where: {
                    id: locationId,
                    space_id: spaceId,
                },
            });

            if (deleted.count === 0) {
                return reply.code(404).send({
                    success: false,
                    error: {
                        code: 'LOCATION_NOT_FOUND',
                        message: 'Location not found',
                    },
                });
            }

            reply.code(204).send();
        }
    );
};

export default locationRoutes;
