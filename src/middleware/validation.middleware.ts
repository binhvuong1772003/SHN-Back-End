import { ZodError, ZodTypeAny } from "zod";
import { Request, Response, NextFunction } from "express";
import { ApiError } from "@/utils/ApiError";
import { ParsedQs } from "qs";
import { ParamsDictionary } from "express-serve-static-core";

export interface ValidationSchema {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
  headers?: ZodTypeAny;
}

export const validate = (schema: ValidationSchema | ZodTypeAny) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const targets: ValidationSchema = typeof (schema as ZodTypeAny).parseAsync === "function"
      ? { body: schema as ZodTypeAny }
      : schema as ValidationSchema;

    try {
      if (targets.body) req.body = await targets.body.parseAsync(req.body);
      if (targets.query) {
        const validatedQuery = await targets.query.parseAsync(req.query) as unknown as ParsedQs;
        Object.defineProperty(req, "query", {
          value: validatedQuery,
          configurable: true,
          enumerable: true,
          writable: true,
        });
      }
      if (targets.params) {
        const validatedParams = await targets.params.parseAsync(req.params) as Record<string, string>;
        req.params = { ...req.params, ...validatedParams } as ParamsDictionary;
      }
      if (targets.headers) await targets.headers.parseAsync(req.headers);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        return next(new ApiError(422, "Invalid request data", details, "VALIDATION_ERROR"));
      }
      return next(error);
    }
  };
};
