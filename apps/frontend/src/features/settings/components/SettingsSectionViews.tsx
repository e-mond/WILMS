'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  SettingsSectionCard,
  SettingsSettingRow,
  SETTINGS_SECTION_ICONS,
} from '@/features/settings/components/SettingsSectionCard';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { PERMISSION } from '@/constants/permissions';
import { USER_ROLE } from '@/constants/roles';
import { useIntegrationStatus } from '@/features/settings/hooks/useIntegrationStatus';
import { useUpdateSystemSettings } from '@/features/settings/hooks/useUpdateSystemSettings';
import { useSettingsMe, useUpdateSettingsMe } from '@/features/settings/hooks/useSettingsMe';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { settingsService } from '@/services';
import type { SystemSettings, UpdateSystemSettingsInput } from '@/types/settings';
import { CurrencyAmount } from '@/components/data-display';

const SecurityIcon = SETTINGS_SECTION_ICONS.security;
const LoanRulesIcon = SETTINGS_SECTION_ICONS.loanRules;
const SmsIcon = SETTINGS_SECTION_ICONS.sms;

function IntegrationSetupNotice({ hint }: { hint: string }) {
  return (
    <p className="mt-wilms-1 max-w-md text-small text-warning">
      {hint}{' '}
      <a
        href="https://github.com/e-mond/WILMS#environment-variables"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-brand-primary hover:underline"
      >
        README env guide →
      </a>
    </p>
  );
}

function useSettingsSave() {
  const toast = useToast();
  const updateSettings = useUpdateSystemSettings();

  async function save(patch: UpdateSystemSettingsInput, successMessage: string) {
    try {
      await updateSettings.mutateAsync(patch);
      toast.success(successMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Try again shortly.';
      toast.error('Unable to save settings', { message });
    }
  }

  return { save, isPending: updateSettings.isPending };
}

export function OrganisationSectionView({ settings }: { settings: SystemSettings }) {
  const { save, isPending } = useSettingsSave();
  const [organisationName, setOrganisationName] = useState(settings.organisationName);
  const [systemName, setSystemName] = useState(settings.systemName);
  const [primaryColour, setPrimaryColour] = useState(settings.primaryColour);
  const [accentColour, setAccentColour] = useState(settings.accentColour);
  const [logoAsset, setLogoAsset] = useState(settings.logoAsset);

  useEffect(() => {
    setOrganisationName(settings.organisationName);
    setSystemName(settings.systemName);
    setPrimaryColour(settings.primaryColour);
    setAccentColour(settings.accentColour);
    setLogoAsset(settings.logoAsset);
  }, [settings]);

  return (
    <SettingsSectionCard
      title="Organisation"
      description="Branding, identity, and system naming."
      icon={<span aria-hidden="true">🏢</span>}
    >
      <SettingsSettingRow
        title="Organisation Name"
        description="Displayed across WILMS interfaces and exports."
        control={
          <Input
            value={organisationName}
            onChange={(event) => setOrganisationName(event.target.value)}
            aria-label="Organisation name"
          />
        }
      />
      <SettingsSettingRow
        title="System Name"
        description="Full legal product name."
        control={
          <Input value={systemName} onChange={(event) => setSystemName(event.target.value)} aria-label="System name" />
        }
      />
      <SettingsSettingRow
        title="Primary Colour"
        description="Brand primary token."
        control={
          <Input
            value={primaryColour}
            onChange={(event) => setPrimaryColour(event.target.value)}
            aria-label="Primary colour"
          />
        }
      />
      <SettingsSettingRow
        title="Accent Colour"
        description="Executive gold accent."
        control={
          <Input
            value={accentColour}
            onChange={(event) => setAccentColour(event.target.value)}
            aria-label="Accent colour"
          />
        }
      />
      <SettingsSettingRow
        title="Logo"
        description="Organisation logo asset."
        control={
          <Input value={logoAsset} onChange={(event) => setLogoAsset(event.target.value)} aria-label="Logo asset" />
        }
      />
      <div className="flex justify-end pt-wilms-2">
        <PermissionGate permission={PERMISSION.MANAGE_SYSTEM_SETTINGS}>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() =>
              void save(
                { organisationName, systemName, primaryColour, accentColour, logoAsset },
                'Organisation settings updated',
              )
            }
          >
            Save organisation
          </Button>
        </PermissionGate>
      </div>
    </SettingsSectionCard>
  );
}

export function MyAccountSectionView() {
  const { data, isLoading } = useSettingsMe();
  const updateMe = useUpdateSettingsMe();
  const toast = useToast();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (data) {
      setDisplayName(data.displayName);
      setEmail(data.email);
    }
  }, [data]);

  if (isLoading || !data) {
    return null;
  }

  return (
    <SettingsSectionCard
      title="My Account"
      description="Your profile and personal preferences."
      icon={<span aria-hidden="true">👤</span>}
    >
      <SettingsSettingRow
        title="Display Name"
        description="Shown in the shell header and audit trail."
        control={
          <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} aria-label="Display name" />
        }
      />
      <SettingsSettingRow
        title="Email Address"
        description="Primary contact email."
        control={<Input value={email} onChange={(event) => setEmail(event.target.value)} aria-label="Email" />}
      />
      <SettingsSettingRow
        title="Role"
        description="Current access level."
        control={<Input value={data.roleLabel} readOnly aria-label="Role" />}
      />
      <SettingsSettingRow
        title="Phone"
        description="Contact number on file."
        control={<Input value={data.phone ?? '—'} readOnly aria-label="Phone" />}
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

export function SecuritySectionView({ settings }: { settings: SystemSettings }) {
  const { save, isPending } = useSettingsSave();
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(String(settings.sessionTimeoutMinutes));
  const [twoFactorRequired, setTwoFactorRequired] = useState(settings.twoFactorRequired);
  const [ipAllowlistEnabled, setIpAllowlistEnabled] = useState(settings.ipAllowlistEnabled);
  const [failedLoginLockoutAttempts, setFailedLoginLockoutAttempts] = useState(
    String(settings.failedLoginLockoutAttempts),
  );
  const [passwordPolicy, setPasswordPolicy] = useState(settings.passwordPolicy);

  useEffect(() => {
    setSessionTimeoutMinutes(String(settings.sessionTimeoutMinutes));
    setTwoFactorRequired(settings.twoFactorRequired);
    setIpAllowlistEnabled(settings.ipAllowlistEnabled);
    setFailedLoginLockoutAttempts(String(settings.failedLoginLockoutAttempts));
    setPasswordPolicy(settings.passwordPolicy);
  }, [settings]);

  return (
    <SettingsSectionCard
      title="Security & Access"
      description="Authentication, session, and lockout policy."
      icon={<SecurityIcon />}
    >
      <SettingsSettingRow
        title="Two-Factor Authentication"
        description="Require 2FA for all Super Admin accounts."
        control={
          <Switch
            checked={twoFactorRequired}
            label="Two-factor authentication"
            onChange={setTwoFactorRequired}
          />
        }
      />
      <SettingsSettingRow
        title="Session Timeout"
        description="Automatically log out inactive users."
        control={
          <Select
            aria-label="Session timeout"
            value={sessionTimeoutMinutes}
            onChange={(event) => setSessionTimeoutMinutes(event.target.value)}
          >
            <option value="30">30 minutes</option>
            <option value="60">60 minutes</option>
            <option value="120">120 minutes</option>
          </Select>
        }
      />
      <SettingsSettingRow
        title="Password Policy"
        description="Enforce minimum strength for all staff passwords."
        control={
          <Select
            aria-label="Password policy"
            value={passwordPolicy}
            onChange={(event) => setPasswordPolicy(event.target.value)}
          >
            <option value="strong">Strong — 12+ chars</option>
            <option value="standard">Standard — 8+ chars</option>
          </Select>
        }
      />
      <SettingsSettingRow
        title="IP Allowlist"
        description="Restrict Super Admin login to approved IP ranges."
        control={
          <Switch checked={ipAllowlistEnabled} label="IP allowlist" onChange={setIpAllowlistEnabled} />
        }
      />
      <SettingsSettingRow
        title="Failed Login Lockout"
        description="Lock account after repeated failed attempts."
        control={
          <Select
            aria-label="Failed login lockout"
            value={failedLoginLockoutAttempts}
            onChange={(event) => setFailedLoginLockoutAttempts(event.target.value)}
          >
            <option value="5">5 attempts</option>
            <option value="10">10 attempts</option>
          </Select>
        }
      />
      <p className="mt-wilms-2 text-small text-text-muted">
        App lock PINs are hashed client-side on collector devices. Reconciliation threshold:{' '}
        {settings.reconciliationVarianceThresholdPercent}%.
      </p>
      <div className="flex justify-end pt-wilms-2">
        <PermissionGate permission={PERMISSION.MANAGE_SYSTEM_SETTINGS}>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() =>
              void save(
                {
                  sessionTimeoutMinutes: Number.parseInt(sessionTimeoutMinutes, 10),
                  twoFactorRequired,
                  ipAllowlistEnabled,
                  failedLoginLockoutAttempts: Number.parseInt(failedLoginLockoutAttempts, 10),
                  passwordPolicy,
                },
                'Security settings updated',
              )
            }
          >
            Save security settings
          </Button>
        </PermissionGate>
      </div>
    </SettingsSectionCard>
  );
}

export function LoanRulesSectionView({ settings }: { settings: SystemSettings }) {
  const { user } = useAuth();
  const { save, isPending } = useSettingsSave();
  const isSuperAdmin = user?.role === USER_ROLE.SUPER_ADMIN;
  const [minGroupSize, setMinGroupSize] = useState(String(settings.minGroupSize));
  const [maxGroupSize, setMaxGroupSize] = useState(String(settings.maxGroupSize));
  const [maxLoanAmountPesewas, setMaxLoanAmountPesewas] = useState(String(settings.maxLoanAmountPesewas));
  const [defaultLoanDurationWeeks, setDefaultLoanDurationWeeks] = useState(
    String(settings.defaultLoanDurationWeeks),
  );
  const [allowLoanRollovers, setAllowLoanRollovers] = useState(settings.allowLoanRollovers);
  const [latePaymentGraceDays, setLatePaymentGraceDays] = useState(String(settings.latePaymentGraceDays));

  useEffect(() => {
    setMinGroupSize(String(settings.minGroupSize));
    setMaxGroupSize(String(settings.maxGroupSize));
    setMaxLoanAmountPesewas(String(settings.maxLoanAmountPesewas));
    setDefaultLoanDurationWeeks(String(settings.defaultLoanDurationWeeks));
    setAllowLoanRollovers(settings.allowLoanRollovers);
    setLatePaymentGraceDays(String(settings.latePaymentGraceDays));
  }, [settings]);

  return (
    <SettingsSectionCard
      title="Loan Rules"
      description="Default caps and calculation parameters."
      icon={<LoanRulesIcon />}
    >
      <SettingsSettingRow
        title="Max Loan Amount"
        description="Per borrower ceiling."
        control={
          isSuperAdmin ? (
            <Input
              type="number"
              min={1}
              value={maxLoanAmountPesewas}
              onChange={(event) => setMaxLoanAmountPesewas(event.target.value)}
              aria-label="Max loan amount in pesewas"
            />
          ) : (
            <Input
              value={`GHS ${(settings.maxLoanAmountPesewas / 100).toLocaleString()}`}
              readOnly
              aria-label="Max loan amount"
            />
          )
        }
      />
      {!isSuperAdmin ? (
        <p className="text-small text-text-muted">
          Current ceiling: <CurrencyAmount value={settings.maxLoanAmountPesewas} />
        </p>
      ) : null}
      <SettingsSettingRow
        title="Min Group Size"
        description="Members required to activate."
        control={
          isSuperAdmin ? (
            <Input
              type="number"
              min={1}
              value={minGroupSize}
              onChange={(event) => setMinGroupSize(event.target.value)}
              aria-label="Min group size"
            />
          ) : (
            <Input defaultValue={`${settings.minGroupSize} members`} readOnly aria-label="Min group size" />
          )
        }
      />
      <SettingsSettingRow
        title="Max Group Size"
        description="Maximum members allowed in a group."
        control={
          isSuperAdmin ? (
            <Input
              type="number"
              min={1}
              value={maxGroupSize}
              onChange={(event) => setMaxGroupSize(event.target.value)}
              aria-label="Max group size"
            />
          ) : (
            <Input defaultValue={`${settings.maxGroupSize} members`} readOnly aria-label="Max group size" />
          )
        }
      />
      <SettingsSettingRow
        title="Default Loan Duration"
        description="Weekly repayment cycles."
        control={
          <Select
            aria-label="Default loan duration"
            value={defaultLoanDurationWeeks}
            onChange={(event) => setDefaultLoanDurationWeeks(event.target.value)}
          >
            <option value="12">12 weeks</option>
            <option value="24">24 weeks</option>
          </Select>
        }
      />
      <SettingsSettingRow
        title="Allow Loan Rollovers"
        description="Permit extending cycle on completion."
        control={
          <Switch checked={allowLoanRollovers} label="Allow loan rollovers" onChange={setAllowLoanRollovers} />
        }
      />
      <SettingsSettingRow
        title="Late Payment Grace Period"
        description="Days before flagging as arrears."
        control={
          <Select
            aria-label="Grace period"
            value={latePaymentGraceDays}
            onChange={(event) => setLatePaymentGraceDays(event.target.value)}
          >
            <option value="3">3 days</option>
            <option value="0">0 days</option>
            <option value="7">7 days</option>
          </Select>
        }
      />
      {isSuperAdmin ? (
        <div className="flex justify-end pt-wilms-2">
          <PermissionGate permission={PERMISSION.MANAGE_SYSTEM_SETTINGS}>
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={() =>
                void save(
                  {
                    minGroupSize: Number.parseInt(minGroupSize, 10),
                    maxGroupSize: Number.parseInt(maxGroupSize, 10),
                    maxLoanAmountPesewas: Number.parseInt(maxLoanAmountPesewas, 10),
                    defaultLoanDurationWeeks: Number.parseInt(defaultLoanDurationWeeks, 10),
                    allowLoanRollovers,
                    latePaymentGraceDays: Number.parseInt(latePaymentGraceDays, 10),
                  },
                  'Loan rules updated',
                )
              }
            >
              Save loan rules
            </Button>
          </PermissionGate>
        </div>
      ) : null}
    </SettingsSectionCard>
  );
}

export function SmsSectionView({ settings }: { settings: SystemSettings }) {
  const { save, isPending } = useSettingsSave();
  const toast = useToast();
  const { data: me } = useSettingsMe();
  const { data: integrationStatus } = useIntegrationStatus();
  const smsRuntimeConfigured = integrationStatus?.sms.configured ?? false;
  const [smsProvider, setSmsProvider] = useState(settings.smsProvider);
  const [smsSenderId, setSmsSenderId] = useState(settings.smsSenderId);
  const [smsNotificationsEnabled, setSmsNotificationsEnabled] = useState(settings.smsNotificationsEnabled);
  const [missedPaymentSmsEnabled, setMissedPaymentSmsEnabled] = useState(settings.missedPaymentSmsEnabled);
  const [approvalSmsEnabled, setApprovalSmsEnabled] = useState(settings.approvalSmsEnabled);
  const [testPhone, setTestPhone] = useState(me?.phone ?? '');
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    setSmsProvider(settings.smsProvider);
    setSmsSenderId(settings.smsSenderId);
    setSmsNotificationsEnabled(settings.smsNotificationsEnabled);
    setMissedPaymentSmsEnabled(settings.missedPaymentSmsEnabled);
    setApprovalSmsEnabled(settings.approvalSmsEnabled);
  }, [settings]);

  useEffect(() => {
    if (me?.phone) {
      setTestPhone(me.phone);
    }
  }, [me?.phone]);

  return (
    <SettingsSectionCard
      title="SMS & Communications"
      description="Automated messaging triggers and SMSNotifyGH provider."
      icon={<SmsIcon />}
    >
      <SettingsSettingRow
        title="SMS Provider"
        description="Active gateway for outbound messages."
        control={
          <Select
            aria-label="SMS provider"
            value={smsProvider}
            onChange={(event) => setSmsProvider(event.target.value)}
          >
            <option value="smsnotifygh">SMSNotifyGH</option>
            <option value="none">Disabled</option>
          </Select>
        }
      />
      <SettingsSettingRow
        title="Backend SMS credentials"
        description="Runtime provider on Railway (independent of the UI label above)."
        control={
          <div>
            <Input
              value={
                integrationStatus
                  ? integrationStatus.sms.configured
                    ? `${integrationStatus.sms.provider} — configured`
                    : `${integrationStatus.sms.provider} — not configured`
                  : 'Checking…'
              }
              readOnly
              aria-label="Backend SMS provider status"
            />
            {integrationStatus && !integrationStatus.sms.configured ? (
              <IntegrationSetupNotice hint={integrationStatus.sms.setupHint} />
            ) : null}
          </div>
        }
      />
      <SettingsSettingRow
        title="Payment Confirmation SMS"
        description="Send receipt to borrower on payment."
        control={
          <Switch
            checked={smsNotificationsEnabled}
            label="Payment confirmation SMS"
            onChange={setSmsNotificationsEnabled}
          />
        }
      />
      <SettingsSettingRow
        title="Missed Payment Alert"
        description="Notify borrower after missed collection."
        control={
          <Switch checked={missedPaymentSmsEnabled} label="Missed payment alert" onChange={setMissedPaymentSmsEnabled} />
        }
      />
      <SettingsSettingRow
        title="Approval Notification"
        description="SMS when loan application approved."
        control={
          <Switch checked={approvalSmsEnabled} label="Approval notification" onChange={setApprovalSmsEnabled} />
        }
      />
      <SettingsSettingRow
        title="SMS Sender ID"
        description="Name shown to recipients."
        control={
          <Input value={smsSenderId} onChange={(event) => setSmsSenderId(event.target.value)} aria-label="SMS sender ID" />
        }
      />
      <SettingsSettingRow
        title="Test SMS"
        description="Send a verification message to confirm provider credentials."
        control={
          <div className="flex flex-wrap gap-wilms-2">
            <Input
              value={testPhone}
              onChange={(event) => setTestPhone(event.target.value)}
              aria-label="Test SMS phone number"
              placeholder="23324xxxxxxx"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isSendingTest || !testPhone.trim() || !smsRuntimeConfigured}
              title={!smsRuntimeConfigured ? integrationStatus?.sms.setupHint : undefined}
              onClick={() => {
                setIsSendingTest(true);
                void settingsService
                  .sendTestSms(testPhone.trim())
                  .then(() => toast.success('Test SMS sent'))
                  .catch((error: unknown) => {
                    const message = error instanceof Error ? error.message : 'Check SMS credentials.';
                    toast.error('Test SMS failed', { message });
                  })
                  .finally(() => setIsSendingTest(false));
              }}
            >
              Send test
            </Button>
          </div>
        }
      />
      <div className="flex justify-end pt-wilms-2">
        <PermissionGate permission={PERMISSION.MANAGE_SYSTEM_SETTINGS}>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() =>
              void save(
                {
                  smsProvider,
                  smsSenderId,
                  smsNotificationsEnabled,
                  missedPaymentSmsEnabled,
                  approvalSmsEnabled,
                },
                'SMS settings updated',
              )
            }
          >
            Save SMS settings
          </Button>
        </PermissionGate>
      </div>
    </SettingsSectionCard>
  );
}

export function NotificationsSectionView({ settings }: { settings: SystemSettings }) {
  const { save, isPending } = useSettingsSave();
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(settings.emailNotificationsEnabled);
  const [paymentReminderDaysBefore, setPaymentReminderDaysBefore] = useState(
    String(settings.paymentReminderDaysBefore),
  );
  const [supervisorEscalationsEnabled, setSupervisorEscalationsEnabled] = useState(
    settings.supervisorEscalationsEnabled,
  );

  useEffect(() => {
    setEmailNotificationsEnabled(settings.emailNotificationsEnabled);
    setPaymentReminderDaysBefore(String(settings.paymentReminderDaysBefore));
    setSupervisorEscalationsEnabled(settings.supervisorEscalationsEnabled);
  }, [settings]);

  return (
    <SettingsSectionCard
      title="Notifications"
      description="Channels, triggers, and escalation rules."
      icon={<span aria-hidden="true">🔔</span>}
    >
      <SettingsSettingRow
        title="Email Notifications"
        description="Registration and loan event emails."
        control={
          <Switch
            checked={emailNotificationsEnabled}
            label="Email notifications"
            onChange={setEmailNotificationsEnabled}
          />
        }
      />
      <SettingsSettingRow
        title="Payment Reminder Lead Time"
        description="Days before due date."
        control={
          <Select
            aria-label="Payment reminder lead time"
            value={paymentReminderDaysBefore}
            onChange={(event) => setPaymentReminderDaysBefore(event.target.value)}
          >
            <option value="1">1 day before</option>
            <option value="2">2 days before</option>
            <option value="3">3 days before</option>
          </Select>
        }
      />
      <SettingsSettingRow
        title="Supervisor Escalations"
        description="Variance and same-day edit alerts."
        control={
          <Switch
            checked={supervisorEscalationsEnabled}
            label="Supervisor escalations"
            onChange={setSupervisorEscalationsEnabled}
          />
        }
      />
      <div className="flex justify-end pt-wilms-2">
        <PermissionGate permission={PERMISSION.MANAGE_SYSTEM_SETTINGS}>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() =>
              void save(
                {
                  emailNotificationsEnabled,
                  paymentReminderDaysBefore: Number.parseInt(paymentReminderDaysBefore, 10),
                  supervisorEscalationsEnabled,
                },
                'Notification settings updated',
              )
            }
          >
            Save notifications
          </Button>
        </PermissionGate>
      </div>
    </SettingsSectionCard>
  );
}

export function IntegrationsSectionView({ settings }: { settings: SystemSettings }) {
  const { save, isPending } = useSettingsSave();
  const toast = useToast();
  const { data: me } = useSettingsMe();
  const { data: integrationStatus } = useIntegrationStatus();
  const smsRuntimeConfigured = integrationStatus?.sms.configured ?? false;
  const mailRuntimeConfigured = integrationStatus?.mail.configured ?? false;
  const [gpsVerificationEnabled, setGpsVerificationEnabled] = useState(settings.gpsVerificationEnabled);
  const [emailProviderLabel, setEmailProviderLabel] = useState(settings.emailProviderLabel);
  const [smsBalance, setSmsBalance] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState(me?.email ?? '');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const smsGatewayStatus = integrationStatus
    ? integrationStatus.sms.configured
      ? `${integrationStatus.sms.provider} — configured`
      : `${integrationStatus.sms.provider} — not configured`
    : 'Checking…';

  useEffect(() => {
    setGpsVerificationEnabled(settings.gpsVerificationEnabled);
    setEmailProviderLabel(settings.emailProviderLabel);
  }, [settings]);

  useEffect(() => {
    if (me?.email) {
      setTestEmail(me.email);
    }
  }, [me?.email]);

  return (
    <SettingsSectionCard
      title="Integrations"
      description="External services and API connectors."
      icon={<span aria-hidden="true">🔌</span>}
    >
      <SettingsSettingRow
        title="SMS Gateway"
        description="SMSNotifyGH outbound messaging (requires Railway env vars)."
        control={
          <div>
            <Input value={smsGatewayStatus} readOnly aria-label="SMS gateway" />
            {integrationStatus && !integrationStatus.sms.configured ? (
              <IntegrationSetupNotice hint={integrationStatus.sms.setupHint} />
            ) : null}
          </div>
        }
      />
      <SettingsSettingRow
        title="SMS Balance"
        description="Live SMSNotifyGH wallet balance."
        control={
          <div className="flex flex-wrap items-center gap-wilms-2">
            <Input value={smsBalance ?? '—'} readOnly aria-label="SMS balance" />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isLoadingBalance || !smsRuntimeConfigured}
              title={!smsRuntimeConfigured ? integrationStatus?.sms.setupHint : undefined}
              onClick={() => {
                setIsLoadingBalance(true);
                void settingsService
                  .getSmsBalance()
                  .then((result) => {
                    setSmsBalance(result.balance);
                    toast.success('SMS balance refreshed');
                  })
                  .catch((error: unknown) => {
                    const message = error instanceof Error ? error.message : 'Check SMS credentials.';
                    toast.error('Unable to load SMS balance', { message });
                  })
                  .finally(() => setIsLoadingBalance(false));
              }}
            >
              Refresh
            </Button>
          </div>
        }
      />
      <SettingsSettingRow
        title="Email Provider"
        description="Gmail SMTP or Resend via backend mail provider."
        control={
          <div>
            <Input
              value={emailProviderLabel}
              onChange={(event) => setEmailProviderLabel(event.target.value)}
              aria-label="Email provider label"
            />
            <Input
              className="mt-wilms-2"
              value={
                integrationStatus
                  ? integrationStatus.mail.configured
                    ? `${integrationStatus.mail.provider} — configured`
                    : `${integrationStatus.mail.provider} — not configured`
                  : 'Checking…'
              }
              readOnly
              aria-label="Backend mail provider status"
            />
            {integrationStatus && !integrationStatus.mail.configured ? (
              <IntegrationSetupNotice hint={integrationStatus.mail.setupHint} />
            ) : null}
          </div>
        }
      />
      <SettingsSettingRow
        title="Test Email"
        description="Send a verification email through Gmail SMTP."
        control={
          <div className="flex flex-wrap gap-wilms-2">
            <Input
              value={testEmail}
              onChange={(event) => setTestEmail(event.target.value)}
              aria-label="Test email address"
              type="email"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isSendingEmail || !testEmail.trim() || !mailRuntimeConfigured}
              title={!mailRuntimeConfigured ? integrationStatus?.mail.setupHint : undefined}
              onClick={() => {
                setIsSendingEmail(true);
                void settingsService
                  .sendTestEmail(testEmail.trim())
                  .then(() => toast.success('Test email sent'))
                  .catch((error: unknown) => {
                    const message = error instanceof Error ? error.message : 'Check Gmail SMTP credentials.';
                    toast.error('Test email failed', { message });
                  })
                  .finally(() => setIsSendingEmail(false));
              }}
            >
              Send test
            </Button>
          </div>
        }
      />
      <SettingsSettingRow
        title="GPS Verification"
        description="Collection location verification."
        control={
          <Switch checked={gpsVerificationEnabled} label="GPS verification" onChange={setGpsVerificationEnabled} />
        }
      />
      <div className="flex justify-end pt-wilms-2">
        <PermissionGate permission={PERMISSION.MANAGE_SYSTEM_SETTINGS}>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() =>
              void save({ gpsVerificationEnabled, emailProviderLabel }, 'Integration settings updated')
            }
          >
            Save integrations
          </Button>
        </PermissionGate>
      </div>
    </SettingsSectionCard>
  );
}

export function AuditSectionView({ settings }: { settings: SystemSettings }) {
  const { save, isPending } = useSettingsSave();
  const [immutableAuditTrail, setImmutableAuditTrail] = useState(settings.immutableAuditTrail);
  const [auditExportEnabled, setAuditExportEnabled] = useState(settings.auditExportEnabled);
  const [monitoringAlertsEnabled, setMonitoringAlertsEnabled] = useState(settings.monitoringAlertsEnabled);

  useEffect(() => {
    setImmutableAuditTrail(settings.immutableAuditTrail);
    setAuditExportEnabled(settings.auditExportEnabled);
    setMonitoringAlertsEnabled(settings.monitoringAlertsEnabled);
  }, [settings]);

  return (
    <SettingsSectionCard
      title="Audit & Logs"
      description="Monitoring, export, and retention controls."
      icon={<span aria-hidden="true">📋</span>}
    >
      <SettingsSettingRow
        title="Immutable Audit Trail"
        description="Prevent modification of audit records."
        control={
          <Switch checked={immutableAuditTrail} label="Immutable audit trail" onChange={setImmutableAuditTrail} />
        }
      />
      <SettingsSettingRow
        title="Audit Export"
        description="Allow compliance exports from audit log."
        control={<Switch checked={auditExportEnabled} label="Audit export" onChange={setAuditExportEnabled} />}
      />
      <SettingsSettingRow
        title="Monitoring Alerts"
        description="Notify admins on critical audit events."
        control={
          <Switch checked={monitoringAlertsEnabled} label="Monitoring alerts" onChange={setMonitoringAlertsEnabled} />
        }
      />
      <SettingsSettingRow
        title="Audit Log Report"
        description="Open the full audit trail report."
        control={
          <Link href="/reports/audit-log" className="text-body font-semibold text-brand-primary hover:underline">
            View audit log →
          </Link>
        }
      />
      <div className="flex justify-end pt-wilms-2">
        <PermissionGate permission={PERMISSION.MANAGE_SYSTEM_SETTINGS}>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() =>
              void save(
                { immutableAuditTrail, auditExportEnabled, monitoringAlertsEnabled },
                'Audit settings updated',
              )
            }
          >
            Save audit settings
          </Button>
        </PermissionGate>
      </div>
    </SettingsSectionCard>
  );
}
