import { Prisma } from '@prisma/client';
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export const errorHandler = async (
    error: FastifyError | ZodError | any,
    request: FastifyRequest,
    reply: FastifyReply
) => {
    // Zod validation errors
    if (error instanceof ZodError) {
        return reply.code(400).send({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request data',
                details: error.issues.map((err: any) => ({
                    path: err.path.join('.'),
                    message: err.message,
                })),
            },
        });
    }

    // Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Unique constraint violation
        if (error.code === 'P2002') {
            return reply.code(409).send({
                success: false,
                error: {
                    code: 'DUPLICATE_ENTRY',
                    message: 'A record with this value already exists',
                    field: error.meta?.target,
                },
            });
        }

        // Foreign key constraint violation
        if (error.code === 'P2003') {
            return reply.code(400).send({
                success: false,
                error: {
                    code: 'INVALID_REFERENCE',
                    message: 'Referenced record does not exist',
                    field: error.meta?.field_name,
                },
            });
        }

        // Record not found
        if (error.code === 'P2025') {
            return reply.code(404).send({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Record not found',
                },
            });
        }
    }

    // Fastify validation errors
    if ('validation' in error && error.validation) {
        return reply.code(400).send({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: error.message,
                details: error.validation,
            },
        });
    }

    // Default error
    const statusCode = ('statusCode' in error && error.statusCode) ? error.statusCode : 500;
    const message =
        statusCode === 500 ? 'Internal server error' : error.message;

    return reply.code(statusCode).send({
        success: false,
        error: {
            code: error.code || 'INTERNAL_ERROR',
            message,
        },
    });
};
