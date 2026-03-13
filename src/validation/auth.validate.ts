import z from 'zod';

export const registerSchema = {
  body: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
};

export const refreshTokenSchema = {
  body: z.object({
    refreshToken: z.string(),
  }),
};

// Type inference - lấy từ body
export type RegisterInput = z.infer<typeof registerSchema.body>;
export type LoginInput = z.infer<typeof loginSchema.body>;
export type RefreshInput = z.infer<typeof refreshTokenSchema.body>;
