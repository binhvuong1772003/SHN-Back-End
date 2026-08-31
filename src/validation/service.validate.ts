// validation/service.validate.ts
import { z } from "zod";
import { objectIdSchema } from "@/validation/common.validate";
export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  imageUrl: z.string().url("Invalid URL").optional(),
});
export const updateCategorySchema = createCategorySchema.partial();
// ============================================================
// OPTION VALUE
// ============================================================
const optionValueSchema = z.object({
  id: objectIdSchema.optional(),
  name: z.string().min(1).max(100),
  imageUrl: z.string().url().optional(),
  price: z.number().min(0),
  duration: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

// ============================================================
// SERVICE
// ============================================================
export const createServiceSchema = z.object({
  categoryId: objectIdSchema.optional(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  basePrice: z.number().min(0).optional(),
  durationMin: z.number().int().min(1),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  options: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        isRequired: z.boolean().default(true),
        sortOrder: z.number().int().default(0),
        values: z.array(optionValueSchema).min(1),
      }),
    )
    .optional(),
});

export const updateServiceSchema = z.object({
  categoryId: z.string().optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  basePrice: z.number().min(0).optional(),
  durationMin: z.number().int().min(1).optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  options: z
    .array(
      z.object({
        id: objectIdSchema.optional(),
        name: z.string().min(1).max(100),
        isRequired: z.boolean().default(true),
        sortOrder: z.number().int().default(0),
        values: z.array(optionValueSchema).min(1),
      }),
    )
    .optional(),
  addons: z
    .array(
      z.object({
        id: objectIdSchema.optional(),
        name: z.string().min(1).max(100),
        price: z.number().min(0),
        duration: z.number().int().min(0).optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .optional(),
  deleteOptionIds: z.array(objectIdSchema).optional(),
  deleteValueIds: z.array(objectIdSchema).optional(),
  deleteAddonIds: z.array(objectIdSchema).optional(),
});

// ============================================================
// SERVICE OPTION
// ============================================================
export const createServiceOptionSchema = z.object({
  name: z.string().min(1).max(100),
  isRequired: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  values: z.array(optionValueSchema).min(1),
});

export const updateServiceOptionSchema = createServiceOptionSchema.partial();

// ============================================================
// SERVICE PACKAGE
// ============================================================
const packageItemSchema = z.object({
  serviceId: objectIdSchema,
  optionValueId: objectIdSchema.optional(),
  isIncluded: z.boolean().default(true),
});

const packageAddonSchema = z.object({
  addonId: objectIdSchema,
  extraPrice: z.number().min(0),
});

export const createServicePackageSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  basePrice: z.number().min(0),
  durationMin: z.number().int().min(1).optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  items: z.array(packageItemSchema).min(1),
  addons: z.array(packageAddonSchema).optional(),
});

export const updateServicePackageSchema = createServicePackageSchema.partial();

export const createAddonSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().min(0),
  duration: z.number().int().min(0).optional(),
  serviceId: objectIdSchema.optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updateAddonSchema = createAddonSchema.partial();

// ============================================================
// TYPES
// ============================================================
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type CreateServiceOptionInput = z.infer<
  typeof createServiceOptionSchema
>;
export type UpdateServiceOptionInput = z.infer<
  typeof updateServiceOptionSchema
>;
export type CreateServicePackageInput = z.infer<
  typeof createServicePackageSchema
>;
export type UpdateServicePackageInput = z.infer<
  typeof updateServicePackageSchema
>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = Partial<CreateCategoryInput>;
