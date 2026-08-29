import type { StaffListQuery } from "@/service/staff/staff.service";
import type { ServiceListQuery } from "@/service/service/service.service";

export const staffListCacheKey = (
  shopSlug: string,
  query: StaffListQuery,
) => {
  const normalizedQuery = {
    page: query.page ?? 1,
    limit: query.limit ?? 5,
    search: query.search ?? "",
    role: query.role ?? "",
    status: query.status ?? "",
    sort: query.sort ?? "RECENT",
  };

  return `shop:${shopSlug}:staff:list:${JSON.stringify(normalizedQuery)}`;
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
  return `shop:${shopSlug}:service:list:${JSON.stringify(normalizedQuery)}`;
};
