import { ZodObject, ZodRawShape, ZodError, ZodTypeAny } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/ApiError';
import { ParsedQs } from 'qs';
import { ParamsDictionary } from 'express-serve-static-core';
interface ValidationSchema {
  body?: ZodTypeAny; // ✅ thay ZodObject<ZodRawShape>
  query?: ZodTypeAny;
  params?: ZodTypeAny;
  headers?: ZodTypeAny;
}

export const validate = (schema: ValidationSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        console.log('body nhận được:', req.body); // ← thêm
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = (await schema.query.parseAsync(
          req.query
        )) as unknown as ParsedQs;
      }
      if (schema.params) {
        req.params = (await schema.params.parseAsync(
          req.params
        )) as unknown as ParamsDictionary;
      }
      if (schema.headers) await schema.headers.parseAsync(req.headers);

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        console.log('Zod errors:', JSON.stringify(error.issues, null, 2));
        const issues =
          error.issues ??
          (error as unknown as { errors?: ZodError['issues'] }).errors ??
          [];
        const messages = issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        next(new ApiError(400, 'Validation Error', messages));
      } else {
        next(error);
      }
    }
  };
};
