/** Runtime detection for Vercel / serverless Route Handlers vs long-lived Node process. */
export function isServerlessRuntime(): boolean {
  const explicit = process.env.WILMS_RUNTIME?.trim().toLowerCase();
  if (explicit === 'serverless' || explicit === 'vercel') {
    return true;
  }
  if (explicit === 'node' || explicit === 'server') {
    return false;
  }
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}
