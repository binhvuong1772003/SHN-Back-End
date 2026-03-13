import { authenticate } from '@/middleware/authenticate.middleware';
import { Router } from 'express';
import { validate } from '@/middleware/validation.middleware';
import { createCategorySchema } from '@/validation/service.validate';
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
categoryRouter.get('/categories/:id', getCategoryByIdController);
categoryRouter.delete('/categories/:id', deleteCategoryController);
categoryRouter.patch('/categories/:id', updateCategoryController);
export default categoryRouter;
