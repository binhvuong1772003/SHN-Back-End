"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCategoryController = exports.getCategoryByIdController = exports.getCategoriesController = exports.deleteCategoryController = exports.createCategoryController = void 0;
const category_service_1 = require("@/service/service/category.service");
const createCategoryController = async (req, res, next) => {
    try {
        const data = req.body;
        const shopSlug = req.params.shopSlug;
        const result = await (0, category_service_1.createCategory)(data, shopSlug);
        res.status(201).json({ success: true, data: result });
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
        res.status(200).json({ success: true, data: result });
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
        res.status(200).json({ success: true, data: result });
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
        res.status(200).json({ success: true, data: result });
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
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
};
exports.updateCategoryController = updateCategoryController;
