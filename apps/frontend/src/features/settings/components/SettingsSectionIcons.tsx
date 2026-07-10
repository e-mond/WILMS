import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  Building2,
  Camera,
  ClipboardList,
  FileText,
  KeyRound,
  Lock,
  Plug,
  RefreshCw,
  Ruler,
  Shield,
  Smartphone,
  User,
} from 'lucide-react';
import { cn } from '@/utils/cn';

const ICON_CLASS = 'h-5 w-5 text-executive-gold';

function SettingsSectionIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon className={ICON_CLASS} aria-hidden="true" />;
}

export function SettingsOrganisationIcon() {
  return <SettingsSectionIcon icon={Building2} />;
}

export function SettingsProfileIcon() {
  return <SettingsSectionIcon icon={User} />;
}

export function SettingsNotificationsIcon() {
  return <SettingsSectionIcon icon={Bell} />;
}

export function SettingsIntegrationsIcon() {
  return <SettingsSectionIcon icon={Plug} />;
}

export function SettingsAuditIcon() {
  return <SettingsSectionIcon icon={ClipboardList} />;
}

export function SettingsRolesIcon() {
  return <SettingsSectionIcon icon={Shield} />;
}

export function SettingsPermissionsIcon() {
  return <SettingsSectionIcon icon={KeyRound} />;
}

export function SettingsExpensesIcon() {
  return <SettingsSectionIcon icon={FileText} />;
}

export function SettingsSyncIcon() {
  return <SettingsSectionIcon icon={RefreshCw} />;
}

export function SettingsDeviceIcon() {
  return <SettingsSectionIcon icon={Smartphone} />;
}

export function SettingsCaptureIcon() {
  return <SettingsSectionIcon icon={Camera} />;
}

export function SettingsSecurityIcon() {
  return <SettingsSectionIcon icon={Lock} />;
}

export function SettingsRulesIcon() {
  return <SettingsSectionIcon icon={Ruler} />;
}

export function settingsIconWrapper(className?: string) {
  return cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-brand-primary-light', className);
}
