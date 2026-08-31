import type { StaffListQuery } from "@/service/staff/staff.service";
import type { ServiceListQuery } from "@/service/service/service.service";
import { redisKey, redisKeyPattern } from "@/cache/cacheConfig";

export const staffListCacheKey = (
  shopSlug: string,
  query: StaffListQuery,
  dateKey?: string,
) => {
  const normalizedQuery = {
    page: query.page ?? 1,
    limit: query.limit ?? 5,
    search: query.search ?? "",
    role: query.role ?? "",
    status: query.status ?? "",
    sort: query.sort ?? "RECENT",
    date: dateKey ?? "",
  };

  return redisKey("shop", shopSlug, "staff", "list", JSON.stringify(normalizedQuery));
};

export const serviceListCacheKey = (shopSlug: string, query: ServiceListQuery) => {
  const normalizedQuery = {
    page: query.page ?? 1,
    limit: query.limit ?? 5,
    search: query.search ?? "",
    status: query.status ?? "",
    category: query.category ?? "",
    sort: query.sort ?? "RECENT",
  };
  return redisKey("shop", shopSlug, "service", "list", JSON.stringify(normalizedQuery));
};

export const staffScheduleCacheKey = (shopId: string, staffId: string) =>
  redisKey("shop", shopId, "staff", staffId, "schedule");

export const staffListCachePattern = (shopSlug: string) =>
  redisKeyPattern("shop", shopSlug, "staff", "list");

export const serviceListCachePattern = (shopSlug: string) =>
  redisKeyPattern("shop", shopSlug, "service", "list");
