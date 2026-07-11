import { getAppVersionLabel } from '@/lib/app-version';

export function AppVersionBadge() {
  const label = getAppVersionLabel();
  if (!label) {
    return null;
  }

  return (
    <p className="text-center text-xs text-text-muted" aria-label={`Version ${label}`}>
      {label}
    </p>
  );
}
