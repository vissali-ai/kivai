// Hourly generation quotas have been retired. Access is controlled by
// authenticated per-account AI credits and the provider's own availability.
// Keep the function for compatibility with existing AI endpoints.
export async function reserveAiRequest(_userId: string): Promise<boolean> {
  return true;
}
