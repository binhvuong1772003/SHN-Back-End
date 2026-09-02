export interface McpContext {
  userId: string;
  shopSlug: string;
  role: string;
  permissions: string[];
  requestId?: string;
}
