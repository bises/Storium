import { z } from 'zod';

// Space schemas
export const createSpaceSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
});

export const updateSpaceSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
});

// Member schemas
export const createMemberSchema = z.object({
    name: z.string().min(1).max(255),
    email: z.string().email(),
    role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).optional(),
});

export const updateMemberSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).optional(),
});

// Location schemas
export const createLocationSchema = z.object({
    name: z.string().min(1).max(255),
    location_type: z.enum(['ROOT', 'FLOOR', 'ROOM', 'CONTAINER', 'OTHER']).optional(),
    parent_location_id: z.string().optional(),
    nfc_tag: z.string().optional(),
    barcode: z.string().optional(),
    qr_code: z.string().optional(),
    created_by_id: z.string(),
});

export const updateLocationSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    location_type: z.enum(['ROOT', 'FLOOR', 'ROOM', 'CONTAINER', 'OTHER']).optional(),
    parent_location_id: z.string().optional().nullable(),
    nfc_tag: z.string().optional().nullable(),
    barcode: z.string().optional().nullable(),
    qr_code: z.string().optional().nullable(),
    updated_by_id: z.string().optional(),
});

// Item schemas
export const createItemSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    quantity: z.number().int().min(0).default(1),
    image_url: z.string().url().optional(),
    location_id: z.string(),
    nfc_tag: z.string().optional(),
    barcode: z.string().optional(),
    qr_code: z.string().optional(),
    created_by_id: z.string(),
});

export const updateItemSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional().nullable(),
    quantity: z.number().int().min(0).optional(),
    image_url: z.string().url().optional().nullable(),
    nfc_tag: z.string().optional().nullable(),
    barcode: z.string().optional().nullable(),
    qr_code: z.string().optional().nullable(),
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
