import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Tên category không được để trống').max(100),
  imageUrl: z.string().url('URL không hợp lệ').optional(),
});

export const createServiceSchema = z.object({
  categoryId: z.string().optional(),
  name: z.string().min(1, 'Tên không được để trống').max(100),
  description: z.string().max(500).optional(),
  basePrice: z.number().min(0).optional(),
  durationMin: z.number().int().min(1, 'Thời gian phải lớn hơn 0'),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

const optionValueSchema = z.object({
  name: z.string().min(1, 'Tên value không được để trống').max(100),
  imageUrl: z.string().url().optional(),
  price: z.number().min(0, 'Giá phải lớn hơn hoặc bằng 0'),
  duration: z.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

const serviceOptionSchema = z.object({
  name: z.string().min(1, 'Tên option không được để trống').max(100),
  isRequired: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  values: z.array(optionValueSchema).min(1, 'Option phải có ít nhất 1 value'),
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
        id: z.string().optional(),
        name: z.string().min(1).max(100),
        isRequired: z.boolean().default(true),
        sortOrder: z.number().int().default(0),
        values: z
          .array(
            z.object({
              id: z.string().optional(),
              name: z.string().min(1).max(100),
              price: z.number().min(0),
              duration: z.number().int().min(0).optional(),
              imageUrl: z.string().url().optional(),
              isActive: z.boolean().optional(),
              sortOrder: z.number().int().optional(),
            })
          )
          .min(1),
      })
    )
    .optional(),
  deleteOptionIds: z.array(z.string()).optional(),
  deleteValueIds: z.array(z.string()).optional(),
  addons: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1).max(100),
        price: z.number().min(0),
        duration: z.number().int().min(0).optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
      })
    )
    .optional(),
  deleteAddonIds: z.array(z.string()).optional(),
});

export const createServicePackageSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0),
  durationMin: z.number().int().min(1),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = Partial<CreateCategoryInput>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type CreateServiceOptionInput = z.infer<typeof serviceOptionSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
