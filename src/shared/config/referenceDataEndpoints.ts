export function referenceDataEndpointsEnabled(env: Record<string, string | undefined> = process.env): boolean {
  const enabled = env.ENABLE_REFERENCE_DATA_ENDPOINTS === 'true';
  if (enabled && env.ENV === 'prod') {
    throw new Error('ENABLE_REFERENCE_DATA_ENDPOINTS must not be set in production');
  }
  return enabled;
}