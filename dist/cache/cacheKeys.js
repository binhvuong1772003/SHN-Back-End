"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceListCachePattern = exports.staffListCachePattern = exports.staffScheduleCacheKey = exports.serviceListCacheKey = exports.staffListCacheKey = void 0;
const cacheConfig_1 = require("@/cache/cacheConfig");
const staffListCacheKey = (shopSlug, query, dateKey) => {
    const normalizedQuery = {
        page: query.page ?? 1,
        limit: query.limit ?? 5,
        search: query.search ?? "",
        role: query.role ?? "",
        status: query.status ?? "",
        sort: query.sort ?? "RECENT",
        date: dateKey ?? "",
    };
    return (0, cacheConfig_1.redisKey)("shop", shopSlug, "staff", "list", JSON.stringify(normalizedQuery));
};
exports.staffListCacheKey = staffListCacheKey;
const serviceListCacheKey = (shopSlug, query) => {
    const normalizedQuery = {
        page: query.page ?? 1,
        limit: query.limit ?? 5,
        search: query.search ?? "",
        status: query.status ?? "",
        category: query.category ?? "",
        sort: query.sort ?? "RECENT",
    };
    return (0, cacheConfig_1.redisKey)("shop", shopSlug, "service", "list", JSON.stringify(normalizedQuery));
};
exports.serviceListCacheKey = serviceListCacheKey;
const staffScheduleCacheKey = (shopId, staffId) => (0, cacheConfig_1.redisKey)("shop", shopId, "staff", staffId, "schedule");
exports.staffScheduleCacheKey = staffScheduleCacheKey;
const staffListCachePattern = (shopSlug) => (0, cacheConfig_1.redisKeyPattern)("shop", shopSlug, "staff", "list");
exports.staffListCachePattern = staffListCachePattern;
const serviceListCachePattern = (shopSlug) => (0, cacheConfig_1.redisKeyPattern)("shop", shopSlug, "service", "list");
exports.serviceListCachePattern = serviceListCachePattern;
