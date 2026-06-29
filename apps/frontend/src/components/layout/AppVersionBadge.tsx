import { getAppVersionLabel } from '@/lib/app-version';

export function AppVersionBadge() {
  const label = getAppVersionLabel();
  if (!label) {
    return null;
  }

  return (
    <p className="mt-wilms-6 text-center text-xs text-muted-foreground" aria-label={`Version ${label}`}>
      {label}
    </p>
  );
}
