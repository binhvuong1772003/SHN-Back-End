import { authenticate } from '@/middleware/authenticate.middleware';
import { Router } from 'express';
import { validate } from '@/middleware/validation.middleware';
import { createCategorySchema, updateCategorySchema } from '@/validation/service.validate';
import { idParamSchema } from '@/validation/common.validate';
import {
  createCategoryController,
  getCategoriesController,
  getCategoryByIdController,
  deleteCategoryController,
  updateCategoryController,
} from '@/controller/service/category.controller';
import { requireShopAccess } from '@/middleware/shop.middleware';
const categoryRouter = Router({ mergeParams: true });
categoryRouter.post(
  '/categories',
  validate({ body: createCategorySchema }),
  createCategoryController
);
categoryRouter.get('/categories', getCategoriesController);
categoryRouter.get('/categories/:id', validate({ params: idParamSchema('id') }), getCategoryByIdController);
categoryRouter.delete('/categories/:id', validate({ params: idParamSchema('id') }), deleteCategoryController);
categoryRouter.patch('/categories/:id', validate({ params: idParamSchema('id'), body: updateCategorySchema }), updateCategoryController);
export default categoryRouter;
