export type HostingPlan = "free" | "pro" | "agency";
export const FAVICON_HOSTING_LIMITS = {
  free: { count: 5, maxBytes: 100 * 1024 },
  pro: { count: 100, maxBytes: 500 * 1024 },
  agency: { count: null, maxBytes: 500 * 1024 },
} as const;
export const FAVICON_BUCKET = "hosted-favicons";
export function hostingLimit(plan: HostingPlan) { return FAVICON_HOSTING_LIMITS[plan]; }
