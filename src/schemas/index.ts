import { z } from 'zod';

// Space schemas
export const createSpaceSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    owner_id: z.string(), // Member who creates/owns the space
});

export const updateSpaceSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
});

// Member schemas (for signup/registration)
export const createMemberSchema = z.object({
    name: z.string().min(1).max(255),
    email: z.string().email(),
    password: z.string().min(8), // Will be hashed before storing
});

export const updateMemberSchema = z.object({
    name: z.string().min(1).max(255).optional(),
});

// Space membership schemas (for inviting members to spaces)
export const addMemberToSpaceSchema = z.object({
    member_id: z.string(),
    role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
});

// Location schemas
export const createLocationSchema = z.object({
    name: z.string().min(1).max(255),
    location_type: z.enum(['ROOT', 'FLOOR', 'ROOM', 'CONTAINER', 'OTHER']).default('OTHER'),
    parent_location_id: z.string().nullable().optional(),
    location_reference_id: z.string().nullable().optional(),
    reference_type: z.enum(['NFC', 'QR_CODE', 'BARCODE', 'MANUAL']).nullable().optional(),
    created_by_id: z.string(),
});

export const updateLocationSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    location_type: z.enum(['ROOT', 'FLOOR', 'ROOM', 'CONTAINER', 'OTHER']).optional(),
    parent_location_id: z.string().optional().nullable(),
    location_reference_id: z.string().optional().nullable(),
    reference_type: z.enum(['NFC', 'QR_CODE', 'BARCODE', 'MANUAL']).optional().nullable(),
    updated_by_id: z.string().optional(),
});

// Item schemas
export const createItemSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().nullable().optional(),
    quantity: z.number().int().min(0).default(1),
    image_url: z.string().url().nullable().optional(),
    location_id: z.string(),
    item_reference_id: z.string().nullable().optional(),
    reference_type: z.enum(['NFC', 'QR_CODE', 'BARCODE', 'MANUAL']).nullable().optional(),
    created_by_id: z.string(),
});

export const updateItemSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional().nullable(),
    quantity: z.number().int().min(0).optional(),
    image_url: z.string().url().optional().nullable(),
    item_reference_id: z.string().optional().nullable(),
    reference_type: z.enum(['NFC', 'QR_CODE', 'BARCODE', 'MANUAL']).optional().nullable(),
    updated_by_id: z.string().optional(),
});

export const moveItemSchema = z.object({
    to_location_id: z.string(),
    moved_by_id: z.string(),
    notes: z.string().optional(),
});

// Tag schemas
export const createTagSchema = z.object({
    name: z.string().min(1).max(100),
    color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    created_by_id: z.string(),
});

export const assignTagSchema = z.object({
    tag_id: z.string(),
});

// Type exports
export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type MoveItemInput = z.infer<typeof moveItemSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type AssignTagInput = z.infer<typeof assignTagSchema>;
