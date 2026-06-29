/** Display label from root package.json via NEXT_PUBLIC_APP_VERSION (set in next.config.mjs). */
export function getAppVersionLabel(): string {
  const version = process.env.NEXT_PUBLIC_APP_VERSION?.trim();
  return version ? `WILMS v${version}` : '';
}
