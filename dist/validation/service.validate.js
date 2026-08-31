"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAddonSchema = exports.createAddonSchema = exports.updateServicePackageSchema = exports.createServicePackageSchema = exports.updateServiceOptionSchema = exports.createServiceOptionSchema = exports.updateServiceSchema = exports.createServiceSchema = exports.updateCategorySchema = exports.createCategorySchema = void 0;
// validation/service.validate.ts
const zod_1 = require("zod");
const common_validate_1 = require("../validation/common.validate");
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Category name is required").max(100),
    imageUrl: zod_1.z.string().url("Invalid URL").optional(),
});
exports.updateCategorySchema = exports.createCategorySchema.partial();
// ============================================================
// OPTION VALUE
// ============================================================
const optionValueSchema = zod_1.z.object({
    id: common_validate_1.objectIdSchema.optional(),
    name: zod_1.z.string().min(1).max(100),
    imageUrl: zod_1.z.string().url().optional(),
    price: zod_1.z.number().min(0),
    duration: zod_1.z.number().int().min(0).optional(),
    isActive: zod_1.z.boolean().optional(),
    sortOrder: zod_1.z.number().int().optional(),
});
// ============================================================
// SERVICE
// ============================================================
exports.createServiceSchema = zod_1.z.object({
    categoryId: common_validate_1.objectIdSchema.optional(),
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(500).optional(),
    basePrice: zod_1.z.number().min(0).optional(),
    durationMin: zod_1.z.number().int().min(1),
    imageUrl: zod_1.z.string().url().optional(),
    isActive: zod_1.z.boolean().default(true),
    sortOrder: zod_1.z.number().int().default(0),
    options: zod_1.z
        .array(zod_1.z.object({
        name: zod_1.z.string().min(1).max(100),
        isRequired: zod_1.z.boolean().default(true),
        sortOrder: zod_1.z.number().int().default(0),
        values: zod_1.z.array(optionValueSchema).min(1),
    }))
        .optional(),
});
exports.updateServiceSchema = zod_1.z.object({
    categoryId: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().max(500).optional(),
    basePrice: zod_1.z.number().min(0).optional(),
    durationMin: zod_1.z.number().int().min(1).optional(),
    imageUrl: zod_1.z.string().url().optional(),
    isActive: zod_1.z.boolean().optional(),
    sortOrder: zod_1.z.number().int().optional(),
    options: zod_1.z
        .array(zod_1.z.object({
        id: common_validate_1.objectIdSchema.optional(),
        name: zod_1.z.string().min(1).max(100),
        isRequired: zod_1.z.boolean().default(true),
        sortOrder: zod_1.z.number().int().default(0),
        values: zod_1.z.array(optionValueSchema).min(1),
    }))
        .optional(),
    addons: zod_1.z
        .array(zod_1.z.object({
        id: common_validate_1.objectIdSchema.optional(),
        name: zod_1.z.string().min(1).max(100),
        price: zod_1.z.number().min(0),
        duration: zod_1.z.number().int().min(0).optional(),
        isActive: zod_1.z.boolean().optional(),
        sortOrder: zod_1.z.number().int().optional(),
    }))
        .optional(),
    deleteOptionIds: zod_1.z.array(common_validate_1.objectIdSchema).optional(),
    deleteValueIds: zod_1.z.array(common_validate_1.objectIdSchema).optional(),
    deleteAddonIds: zod_1.z.array(common_validate_1.objectIdSchema).optional(),
});
// ============================================================
// SERVICE OPTION
// ============================================================
exports.createServiceOptionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    isRequired: zod_1.z.boolean().default(true),
    sortOrder: zod_1.z.number().int().default(0),
    values: zod_1.z.array(optionValueSchema).min(1),
});
exports.updateServiceOptionSchema = exports.createServiceOptionSchema.partial();
// ============================================================
// SERVICE PACKAGE
// ============================================================
const packageItemSchema = zod_1.z.object({
    serviceId: common_validate_1.objectIdSchema,
    optionValueId: common_validate_1.objectIdSchema.optional(),
    isIncluded: zod_1.z.boolean().default(true),
});
const packageAddonSchema = zod_1.z.object({
    addonId: common_validate_1.objectIdSchema,
    extraPrice: zod_1.z.number().min(0),
});
exports.createServicePackageSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(500).optional(),
    imageUrl: zod_1.z.string().url().optional(),
    basePrice: zod_1.z.number().min(0),
    durationMin: zod_1.z.number().int().min(1).optional(),
    isActive: zod_1.z.boolean().default(true),
    sortOrder: zod_1.z.number().int().default(0),
    items: zod_1.z.array(packageItemSchema).min(1),
    addons: zod_1.z.array(packageAddonSchema).optional(),
});
exports.updateServicePackageSchema = exports.createServicePackageSchema.partial();
exports.createAddonSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    price: zod_1.z.number().min(0),
    duration: zod_1.z.number().int().min(0).optional(),
    serviceId: common_validate_1.objectIdSchema.optional(),
    isActive: zod_1.z.boolean().default(true),
    sortOrder: zod_1.z.number().int().default(0),
});
exports.updateAddonSchema = exports.createAddonSchema.partial();
