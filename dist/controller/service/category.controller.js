"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCategoryController = exports.getCategoryByIdController = exports.getCategoriesController = exports.deleteCategoryController = exports.createCategoryController = void 0;
const category_service_1 = require("@/service/service/category.service");
const apiResponse_1 = require("@/utils/apiResponse");
const createCategoryController = async (req, res, next) => {
    try {
        const data = req.body;
        const shopSlug = req.params.shopSlug;
        const result = await (0, category_service_1.createCategory)(data, shopSlug);
        (0, apiResponse_1.sendSuccess)(res, result, { statusCode: 201 });
    }
    catch (error) {
        next(error);
    }
};
exports.createCategoryController = createCategoryController;
const deleteCategoryController = async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await (0, category_service_1.deleteCategory)(id);
        (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.deleteCategoryController = deleteCategoryController;
const getCategoriesController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const result = await (0, category_service_1.getCategories)(shopSlug);
        (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.getCategoriesController = getCategoriesController;
const getCategoryByIdController = async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await (0, category_service_1.getCategoryById)(id);
        (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.getCategoryByIdController = getCategoryByIdController;
const updateCategoryController = async (req, res, next) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const result = await (0, category_service_1.updateCategory)(id, data);
        (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.updateCategoryController = updateCategoryController;
