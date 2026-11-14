/** Temporary public mode. Existing subscriptions stay active for access and billing. */
export const FREE_PUBLIC_MODE = true;
export const INTERNAL_PROJECT_LIMIT = 5;
export const INTERNAL_USER_STORAGE_BYTES = 100 * 1024 * 1024;
export const INITIAL_AI_CREDITS = 5;

export function isPaidSalesEnabled() {
  return !FREE_PUBLIC_MODE;
}
