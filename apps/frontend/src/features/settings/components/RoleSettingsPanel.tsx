'use client';

import { useMemo, useState, useEffect } from 'react';
import { Avatar } from '@/components/data-display/Avatar';
import { AppLockSetupPanel } from '@/features/app-lock/components/AppLockSetupPanel';
import {
  SettingsSectionCard,
  SettingsSettingRow,
} from '@/features/settings/components/SettingsSectionCard';
import { SettingsUsersSection } from '@/features/settings/components/SettingsUsersSection';
import { SettingsRolesSection } from '@/features/settings/components/SettingsRolesSection';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import {
  ROLE_SETTINGS_SECTION,
  ROLE_SETTINGS_SECTIONS,
  type RoleSettingsSection,
} from '@/constants/role-settings-sections';
import { USER_ROLE, type UserRole } from '@/constants/roles';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useSettingsMe, useUpdateSettingsMe } from '@/features/settings/hooks/useSettingsMe';
import { NotificationPreferencesSection } from '@/features/settings/components/NotificationPreferencesSection';
import { DeviceHealthPanel } from '@/features/device-management/components/DeviceHealthPanel';
import { roleSettingsPreferences } from '@/features/settings/utils/role-settings-preferences';
import { PhotoUpload } from '@/components/forms/PhotoUpload';
import { UPLOAD_PURPOSE } from '@/types/upload';
import { resolvePersonPhotoUrl } from '@/utils/person-photo';
import { resolveUserDisplayId } from '@/utils/entity-display-id';
import {
  SettingsAuditIcon,
  SettingsCaptureIcon,
  SettingsDeviceIcon,
  SettingsIntegrationsIcon,
  SettingsProfileIcon,
  SettingsRulesIcon,
  SettingsSecurityIcon,
  SettingsSyncIcon,
} from '@/features/settings/components/SettingsSectionIcons';
import { cn } from '@/utils/cn';
import { useReplayProductTour } from '@/components/onboarding/ProductTourOverlay';

function ProfileSection() {
  const { user } = useAuth();
  const replayTour = useReplayProductTour();
  const toast = useToast();
  const { data: me } = useSettingsMe();
  const updateMe = useUpdateSettingsMe();
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (me) {
      setDisplayName(me.displayName);
      setEmail(me.email);
    }
  }, [me]);

  if (!user?.id || !me) {
    return null;
  }

  const resolvedDisplayName = displayName || user.displayName || 'WILMS User';

  return (
    <SettingsSectionCard
      title="Profile"
      description="Your account identity in WILMS."
      icon={<SettingsProfileIcon />}
    >
      <div className="mb-wilms-4 flex items-center gap-wilms-3">
        <Avatar
          label={resolvedDisplayName}
          photoUrl={resolvePersonPhotoUrl({
            name: resolvedDisplayName,
            id: user.id,
            uploadUrl: profilePhotoUrl,
          })}
          size="lg"
        />
        <div>
          <p className="text-body font-semibold text-text-primary">{resolvedDisplayName}</p>
          <p className="text-small text-text-muted">{user.role?.replace(/_/g, ' ') ?? 'User'}</p>
        </div>
      </div>
      <SettingsSettingRow
        title="Profile Photo"
        description="Upload or replace your profile photo."
        control={
          <PhotoUpload
            id="profile-photo-upload"
            value={null}
            onChange={() => undefined}
            uploadPurpose={UPLOAD_PURPOSE.PROFILE_PHOTO}
            entityId={user.id}
            onUploadRecordChange={(record) => setProfilePhotoUrl(record?.url ?? null)}
          />
        }
      />
      <SettingsSettingRow
        title="Display Name"
        description="Shown in the shell header and audit trail."
        control={
          <Input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            aria-label="Display name"
          />
        }
      />
      <SettingsSettingRow
        title="Email Address"
        description="Primary contact email."
        control={
          <Input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-label="Email address"
            type="email"
          />
        }
      />
      <SettingsSettingRow
        title="User ID"
        description="Internal account identifier."
        control={<Input defaultValue={resolveUserDisplayId(user.id)} readOnly aria-label="User ID" />}
      />
      <SettingsSettingRow
        title="Role"
        description="Current access level."
        control={<Input defaultValue={user.role?.replace(/_/g, ' ') ?? 'User'} readOnly aria-label="Role" />}
      />
      <SettingsSettingRow
        title="Product tour"
        description="Replay the guided walkthrough for your role."
        control={
          <Button type="button" size="sm" variant="secondary" onClick={replayTour}>
            Replay tour
          </Button>
        }
      />
      <div className="flex justify-end pt-wilms-2">
        <Button
          type="button"
          size="sm"
          disabled={updateMe.isPending}
          onClick={() => {
            void updateMe
              .mutateAsync({ displayName, email })
              .then(() => toast.success('Profile updated'))
              .catch((error: unknown) => {
                const message = error instanceof Error ? error.message : 'Try again shortly.';
                toast.error('Unable to update profile', { message });
              });
          }}
        >
          Save profile
        </Button>
      </div>
    </SettingsSectionCard>
  );
}

function NotificationsSection() {
  return <NotificationPreferencesSection />;
}

function SyncSection() {
  const toast = useToast();
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState('15');

  useEffect(() => {
    setAutoSync(roleSettingsPreferences.getAutoSync());
    setSyncInterval(roleSettingsPreferences.getSyncInterval());
  }, []);

  return (
    <SettingsSectionCard
      title="Sync"
      description="Offline queue and background sync."
      icon={<SettingsSyncIcon />}
    >
      <SettingsSettingRow
        title="Auto Sync"
        description="Upload pending records when online."
        control={<Switch checked={autoSync} label="Auto sync" onChange={setAutoSync} />}
      />
      <SettingsSettingRow
        title="Sync Interval"
        description="Background refresh frequency."
        control={
          <Select
            aria-label="Sync interval"
            value={syncInterval}
            onChange={(event) => setSyncInterval(event.target.value)}
          >
            <option value="15">Every 15 minutes</option>
            <option value="30">Every 30 minutes</option>
          </Select>
        }
      />
      <div className="flex justify-end pt-wilms-2">
        <Button
          type="button"
          size="sm"
          onClick={() => {
            roleSettingsPreferences.setAutoSync(autoSync);
            roleSettingsPreferences.setSyncInterval(syncInterval);
            toast.success('Sync preferences saved');
          }}
        >
          Save sync settings
        </Button>
      </div>
    </SettingsSectionCard>
  );
}

function DeviceSection() {
  const toast = useToast();
  const [gpsVerification, setGpsVerification] = useState(true);
  const [lowDataMode, setLowDataMode] = useState(false);

  useEffect(() => {
    setGpsVerification(roleSettingsPreferences.getGpsVerification());
    setLowDataMode(roleSettingsPreferences.getLowDataMode());
  }, []);

  return (
    <>
      <SettingsSectionCard
        title="Device Settings"
        description="Field device preferences."
        icon={<SettingsDeviceIcon />}
      >
        <SettingsSettingRow
          title="GPS Verification"
          description="Require location on collections."
          control={
            <Switch checked={gpsVerification} label="GPS verification" onChange={setGpsVerification} />
          }
        />
        <SettingsSettingRow
          title="Low Data Mode"
          description="Reduce image upload size in the field."
          control={<Switch checked={lowDataMode} label="Low data mode" onChange={setLowDataMode} />}
        />
        <div className="flex justify-end pt-wilms-2">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              roleSettingsPreferences.setGpsVerification(gpsVerification);
              roleSettingsPreferences.setLowDataMode(lowDataMode);
              toast.success('Device preferences saved');
            }}
          >
            Save device settings
          </Button>
        </div>
      </SettingsSectionCard>
      <div className="mt-wilms-4">
        <DeviceHealthPanel />
      </div>
    </>
  );
}

function CameraSection() {
  const toast = useToast();
  const [preferredCapture, setPreferredCapture] = useState('mobile');
  const [passportCropGuide, setPassportCropGuide] = useState(true);

  useEffect(() => {
    setPreferredCapture(roleSettingsPreferences.getPreferredCapture());
    setPassportCropGuide(roleSettingsPreferences.getPassportCropGuide());
  }, []);

  return (
    <SettingsSectionCard
      title="Camera Settings"
      description="Photo capture defaults for registration."
      icon={<SettingsCaptureIcon />}
    >
      <SettingsSettingRow
        title="Preferred Capture"
        description="Default workflow when both options are available."
        control={
          <Select
            aria-label="Preferred capture"
            value={preferredCapture}
            onChange={(event) => setPreferredCapture(event.target.value)}
          >
            <option value="mobile">Capture using mobile</option>
            <option value="device">Take photo on this device</option>
          </Select>
        }
      />
      <SettingsSettingRow
        title="Passport Crop Guide"
        description="Show framing overlay during capture."
        control={
          <Switch checked={passportCropGuide} label="Passport crop guide" onChange={setPassportCropGuide} />
        }
      />
      <div className="flex justify-end pt-wilms-2">
        <Button
          type="button"
          size="sm"
          onClick={() => {
            roleSettingsPreferences.setPreferredCapture(preferredCapture);
            roleSettingsPreferences.setPassportCropGuide(passportCropGuide);
            toast.success('Camera preferences saved');
          }}
        >
          Save camera settings
        </Button>
      </div>
    </SettingsSectionCard>
  );
}

function SecuritySection() {
  return (
    <SettingsSectionCard
      title="Security"
      description="Authentication and session controls."
      icon={<SettingsSecurityIcon />}
    >
      <SettingsSettingRow
        title="Session Timeout"
        description="Automatically lock after inactivity."
        control={
          <Select aria-label="Session timeout" defaultValue="30" disabled>
            <option value="30">30 minutes</option>
          </Select>
        }
      />
      <SettingsSettingRow
        title="Two-Factor Authentication"
        description="Require 2FA for sensitive actions."
        control={<Switch checked={false} label="Two-factor authentication" disabled onChange={() => undefined} />}
      />
    </SettingsSectionCard>
  );
}

function AuditPreferencesSection() {
  const toast = useToast();
  const [highRiskAlerts, setHighRiskAlerts] = useState(true);
  const [defaultExportScope, setDefaultExportScope] = useState('30');

  useEffect(() => {
    setHighRiskAlerts(roleSettingsPreferences.getHighRiskAlerts());
    setDefaultExportScope(roleSettingsPreferences.getDefaultExportScope());
  }, []);

  return (
    <SettingsSectionCard
      title="Audit Preferences"
      description="Compliance review defaults."
      icon={<SettingsAuditIcon />}
    >
      <SettingsSettingRow
        title="High-Risk Alerts"
        description="Notify on flagged audit events."
        control={
          <Switch checked={highRiskAlerts} label="High-risk alerts" onChange={setHighRiskAlerts} />
        }
      />
      <SettingsSettingRow
        title="Default Export Scope"
        description="Preferred audit log range."
        control={
          <Select
            aria-label="Default export scope"
            value={defaultExportScope}
            onChange={(event) => setDefaultExportScope(event.target.value)}
          >
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </Select>
        }
      />
      <div className="flex justify-end pt-wilms-2">
        <Button
          type="button"
          size="sm"
          onClick={() => {
            roleSettingsPreferences.setHighRiskAlerts(highRiskAlerts);
            roleSettingsPreferences.setDefaultExportScope(defaultExportScope);
            toast.success('Audit preferences saved');
          }}
        >
          Save audit preferences
        </Button>
      </div>
    </SettingsSectionCard>
  );
}

function IntegrationsSection() {
  return (
    <SettingsSectionCard
      title="Integrations"
      description="External services and connectors."
      icon={<SettingsIntegrationsIcon />}
    >
      <SettingsSettingRow
        title="SMS Gateway"
        description="SMSNotifyGH outbound messaging."
        control={<Input defaultValue="Connected" readOnly aria-label="SMS gateway" />}
      />
      <SettingsSettingRow
        title="Email Provider"
        description="Transactional email service."
        control={<Input defaultValue="Demo SMTP" readOnly aria-label="Email provider" />}
      />
    </SettingsSectionCard>
  );
}

function RulesSection() {
  return (
    <SettingsSectionCard
      title="Rules"
      description="Programme and loan rule defaults."
      icon={<SettingsRulesIcon />}
    >
      <SettingsSettingRow
        title="Max Group Size"
        description="Members allowed per active group."
        control={<Input defaultValue="15 members" readOnly aria-label="Max group size" />}
      />
      <SettingsSettingRow
        title="Registration Legal Text"
        description="Managed in registration legal configuration."
        control={<Input defaultValue="Configured" readOnly aria-label="Registration legal text" />}
      />
    </SettingsSectionCard>
  );
}

function renderSection(section: RoleSettingsSection, role: UserRole) {
  switch (section) {
    case ROLE_SETTINGS_SECTION.PROFILE:
      return <ProfileSection />;
    case ROLE_SETTINGS_SECTION.APP_LOCK:
      return <AppLockSetupPanel />;
    case ROLE_SETTINGS_SECTION.NOTIFICATIONS:
      return <NotificationsSection />;
    case ROLE_SETTINGS_SECTION.SYNC:
      return <SyncSection />;
    case ROLE_SETTINGS_SECTION.DEVICE:
      return <DeviceSection />;
    case ROLE_SETTINGS_SECTION.CAMERA:
      return <CameraSection />;
    case ROLE_SETTINGS_SECTION.SECURITY:
      return <SecuritySection />;
    case ROLE_SETTINGS_SECTION.AUDIT_PREFERENCES:
      return <AuditPreferencesSection />;
    case ROLE_SETTINGS_SECTION.USERS:
      return role === USER_ROLE.SUPER_ADMIN ? <SettingsUsersSection /> : null;
    case ROLE_SETTINGS_SECTION.ROLES:
      return role === USER_ROLE.SUPER_ADMIN ? <SettingsRolesSection /> : null;
    case ROLE_SETTINGS_SECTION.INTEGRATIONS:
      return <IntegrationsSection />;
    case ROLE_SETTINGS_SECTION.RULES:
      return <RulesSection />;
    default:
      return null;
  }
}

export interface RoleSettingsPanelProps {
  role?: UserRole;
}

export function RoleSettingsPanel({ role: roleOverride }: RoleSettingsPanelProps) {
  const { user } = useAuth();
  const role = roleOverride ?? user?.role ?? USER_ROLE.SUPER_ADMIN;
  const sections = ROLE_SETTINGS_SECTIONS[role];
  const [activeSection, setActiveSection] = useState<RoleSettingsSection>(sections[0]?.id ?? ROLE_SETTINGS_SECTION.PROFILE);

  const activeContent = useMemo(
    () => renderSection(activeSection, role),
    [activeSection, role],
  );

  return (
    <div className="grid gap-wilms-4 xl:grid-cols-[220px_minmax(0,1fr)]">
      <nav
        aria-label="Settings categories"
        className="flex gap-wilms-2 overflow-x-auto pb-wilms-1 xl:block xl:space-y-wilms-1 xl:overflow-visible xl:pb-0"
      >
        <p className="hidden px-wilms-3 pb-wilms-2 text-small font-semibold uppercase tracking-wide text-text-muted xl:block">
          Settings
        </p>
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={cn(
              'shrink-0 border-l-2 px-wilms-3 py-wilms-2 text-left text-body font-semibold transition-colors xl:flex xl:w-full xl:items-center',
              activeSection === section.id
                ? 'border-executive-gold bg-brand-primary-light text-executive-gold'
                : 'border-transparent text-text-muted hover:border-border hover:bg-background hover:text-text-primary',
            )}
            aria-current={activeSection === section.id ? 'page' : undefined}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>

      <div className="min-w-0 space-y-wilms-4">{activeContent}</div>
    </div>
  );
}
