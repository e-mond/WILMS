'use client';

import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import {
  SettingsSectionCard,
  SettingsSettingRow,
  SETTINGS_SECTION_ICONS,
} from '@/features/settings/components/SettingsSectionCard';
import { SettingsAsidePanel } from '@/features/settings/components/SettingsAsidePanel';
import { SettingsUsersSection } from '@/features/settings/components/SettingsUsersSection';
import { SettingsRolesSection } from '@/features/settings/components/SettingsRolesSection';
import { SettingsExpensesSection } from '@/features/settings/components/SettingsExpensesSection';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { PERMISSION } from '@/constants/permissions';
import {
  SETTINGS_SECTION,
  SETTINGS_SECTIONS,
  type SettingsSection,
} from '@/constants/settings-sections';
import { USER_ROLE } from '@/constants/roles';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { useUpdateSystemSettings } from '@/features/settings/hooks/useUpdateSystemSettings';
import { useShellAsideContent } from '@/hooks/useShellAsideContent';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import type { SystemSettings } from '@/types/settings';
import { cn } from '@/utils/cn';

const SecurityIcon = SETTINGS_SECTION_ICONS.security;
const LoanRulesIcon = SETTINGS_SECTION_ICONS.loanRules;
const SmsIcon = SETTINGS_SECTION_ICONS.sms;

function SecuritySection({ settings }: { settings: SystemSettings }) {
  return (
    <SettingsSectionCard
      title="Security & Access"
      description="Manage roles, permissions, and authentication settings."
      icon={<SecurityIcon />}
    >
      <SettingsSettingRow
        title="Two-Factor Authentication"
        description="Require 2FA for all Super Admin accounts."
        control={<Switch checked label="Two-factor authentication" disabled onChange={() => undefined} />}
      />
      <SettingsSettingRow
        title="Session Timeout"
        description="Automatically log out inactive users."
        control={
          <Select aria-label="Session timeout" defaultValue="30" disabled>
            <option value="30">30 minutes</option>
            <option value="60">60 minutes</option>
          </Select>
        }
      />
      <SettingsSettingRow
        title="Password Policy"
        description="Enforce minimum strength for all staff passwords."
        control={
          <Select aria-label="Password policy" defaultValue="strong" disabled>
            <option value="strong">Strong — 12+ chars</option>
          </Select>
        }
      />
      <SettingsSettingRow
        title="IP Allowlist"
        description="Restrict Super Admin login to approved IP ranges."
        control={<Switch checked={false} label="IP allowlist" disabled onChange={() => undefined} />}
      />
      <SettingsSettingRow
        title="Failed Login Lockout"
        description="Lock account after repeated failed attempts."
        control={
          <Select aria-label="Failed login lockout" defaultValue="5" disabled>
            <option value="5">5 attempts</option>
            <option value="10">10 attempts</option>
          </Select>
        }
      />
      <p className="mt-wilms-2 text-small text-text-muted">
        Reconciliation threshold: {settings.reconciliationVarianceThresholdPercent}% · Demo read-only.
      </p>
    </SettingsSectionCard>
  );
}

function LoanRulesSection({ settings }: { settings: SystemSettings }) {
  const { user } = useAuth();
  const toast = useToast();
  const updateSettings = useUpdateSystemSettings();
  const isSuperAdmin = user?.role === USER_ROLE.SUPER_ADMIN;
  const [minGroupSize, setMinGroupSize] = useState(String(settings.minGroupSize));
  const [maxGroupSize, setMaxGroupSize] = useState(String(settings.maxGroupSize));

  useEffect(() => {
    setMinGroupSize(String(settings.minGroupSize));
    setMaxGroupSize(String(settings.maxGroupSize));
  }, [settings.minGroupSize, settings.maxGroupSize]);

  async function handleSaveGroupSizeRules() {
    const parsedMin = Number.parseInt(minGroupSize, 10);
    const parsedMax = Number.parseInt(maxGroupSize, 10);

    if (!Number.isFinite(parsedMin) || !Number.isFinite(parsedMax)) {
      toast.error('Invalid group size', { message: 'Enter whole numbers for group size limits.' });
      return;
    }

    try {
      await updateSettings.mutateAsync({ minGroupSize: parsedMin, maxGroupSize: parsedMax });
      toast.success('Group size rules updated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Try again shortly.';
      toast.error('Unable to save group size rules', { message });
    }
  }

  return (
    <SettingsSectionCard
      title="Loan Rules"
      description="Default caps and calculation parameters."
      icon={<LoanRulesIcon />}
    >
      <SettingsSettingRow
        title="Max Loan Amount"
        description="Per borrower ceiling."
        control={<Input defaultValue="GHS 5,000" readOnly aria-label="Max loan amount" />}
      />
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
            <Input
              defaultValue={`${settings.minGroupSize} members`}
              readOnly
              aria-label="Min group size"
            />
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
            <Input
              defaultValue={`${settings.maxGroupSize} members`}
              readOnly
              aria-label="Max group size"
            />
          )
        }
      />
      {isSuperAdmin ? (
        <div className="flex justify-end pt-wilms-2">
          <PermissionGate permission={PERMISSION.MANAGE_SYSTEM_SETTINGS}>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleSaveGroupSizeRules()}
              disabled={updateSettings.isPending}
            >
              Save group size rules
            </Button>
          </PermissionGate>
        </div>
      ) : null}
      <SettingsSettingRow
        title="Default Loan Duration"
        description="Weekly repayment cycles."
        control={
          <Select aria-label="Default loan duration" defaultValue="12" disabled>
            <option value="12">12 weeks</option>
            <option value="24">24 weeks</option>
          </Select>
        }
      />
      <SettingsSettingRow
        title="Allow Loan Rollovers"
        description="Permit extending cycle on completion."
        control={<Switch checked label="Allow loan rollovers" disabled onChange={() => undefined} />}
      />
      <SettingsSettingRow
        title="Late Payment Grace Period"
        description="Days before flagging as arrears."
        control={
          <Select aria-label="Grace period" defaultValue="3" disabled>
            <option value="3">3 days</option>
            <option value="0">0 days</option>
          </Select>
        }
      />
    </SettingsSectionCard>
  );
}

function SmsSection({ settings }: { settings: SystemSettings }) {
  return (
    <SettingsSectionCard
      title="SMS & Communications"
      description="Automated messaging triggers and provider."
      icon={<SmsIcon />}
    >
      <SettingsSettingRow
        title="SMS Provider"
        description="Active gateway for outbound messages."
        control={
          <Select aria-label="SMS provider" defaultValue="hubtel" disabled>
            <option value="hubtel">Hubtel SMS</option>
          </Select>
        }
      />
      <SettingsSettingRow
        title="Payment Confirmation SMS"
        description="Send receipt to borrower on payment."
        control={
          <Switch
            checked={settings.smsNotificationsEnabled}
            label="Payment confirmation SMS"
            disabled
            onChange={() => undefined}
          />
        }
      />
      <SettingsSettingRow
        title="Missed Payment Alert"
        description="Notify borrower after missed collection."
        control={<Switch checked label="Missed payment alert" disabled onChange={() => undefined} />}
      />
      <SettingsSettingRow
        title="Approval Notification"
        description="SMS when loan application approved."
        control={<Switch checked label="Approval notification" disabled onChange={() => undefined} />}
      />
      <SettingsSettingRow
        title="SMS Sender ID"
        description="Name shown to recipients."
        control={<Input defaultValue="WILMS-GH" readOnly aria-label="SMS sender ID" />}
      />
    </SettingsSectionCard>
  );
}

export function SettingsPanel() {
  const { data, isLoading, isError } = useSettings();
  const [activeSection, setActiveSection] = useState<SettingsSection>(SETTINGS_SECTION.SECURITY);

  const activeSectionLabel =
    SETTINGS_SECTIONS.find((section) => section.id === activeSection)?.label ?? 'Settings';

  const asideContent = useMemo(
    () =>
      data ? (
        <SettingsAsidePanel updatedAt={data.updatedAt} activeSectionLabel={activeSectionLabel} />
      ) : null,
    [activeSectionLabel, data],
  );

  useShellAsideContent(asideContent);

  if (isLoading) {
    return <LoadingSpinner label="Loading system settings" className="py-wilms-8" />;
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Unable to load settings"
        description="Check your connection and try again."
      />
    );
  }

  return (
    <div className="grid gap-wilms-4 xl:grid-cols-[220px_minmax(0,1fr)]">
      <nav
        aria-label="Settings categories"
        className="flex gap-wilms-2 overflow-x-auto pb-wilms-1 xl:block xl:space-y-wilms-1 xl:overflow-visible xl:pb-0"
      >
        <p className="hidden px-wilms-3 pb-wilms-2 text-small font-semibold uppercase tracking-wide text-text-muted xl:block">
          Configuration
        </p>
        {SETTINGS_SECTIONS.map((section) => (
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

      <div className="min-w-0 space-y-wilms-4">
        {activeSection === SETTINGS_SECTION.SECURITY ? (
          <div className="space-y-wilms-4">
            <SecuritySection settings={data} />
            <SettingsUsersSection />
            <div className="grid gap-wilms-4 xl:grid-cols-2">
              <LoanRulesSection settings={data} />
              <SmsSection settings={data} />
            </div>
          </div>
        ) : null}

        {activeSection === SETTINGS_SECTION.ORGANISATION ? (
          <SettingsSectionCard
            title="Organisation"
            description="Branding, identity, and system naming."
            icon={<span aria-hidden="true">🏢</span>}
          >
            <SettingsSettingRow
              title="Organisation Name"
              description="Displayed across WILMS interfaces and exports."
              control={<Input defaultValue="WILMS" readOnly aria-label="Organisation name" />}
            />
            <SettingsSettingRow
              title="System Name"
              description="Full legal product name."
              control={
                <Input
                  defaultValue="Women's Interest-Free Loan Management System"
                  readOnly
                  aria-label="System name"
                />
              }
            />
            <SettingsSettingRow
              title="Primary Colour"
              description="Brand primary token."
              control={<Input defaultValue="#0F6E56" readOnly aria-label="Primary colour" />}
            />
            <SettingsSettingRow
              title="Accent Colour"
              description="Executive gold accent."
              control={<Input defaultValue="#BA7517" readOnly aria-label="Accent colour" />}
            />
            <SettingsSettingRow
              title="Logo"
              description="Organisation logo asset."
              control={<Input defaultValue="wilms-logo.svg" readOnly aria-label="Logo asset" />}
            />
          </SettingsSectionCard>
        ) : null}

        {activeSection === SETTINGS_SECTION.MY_ACCOUNT ? (
          <SettingsSectionCard
            title="My Account"
            description="Your profile and personal preferences."
            icon={<span aria-hidden="true">👤</span>}
          >
            <SettingsSettingRow
              title="Display Name"
              description="Shown in the shell header and audit trail."
              control={<Input defaultValue="Ama Boateng" readOnly aria-label="Display name" />}
            />
            <SettingsSettingRow
              title="Email Address"
              description="Primary contact email."
              control={<Input defaultValue="ama.boateng@wilms.demo" readOnly aria-label="Email" />}
            />
            <SettingsSettingRow
              title="Role"
              description="Current access level."
              control={<Input defaultValue="Super Admin" readOnly aria-label="Role" />}
            />
            <SettingsSettingRow
              title="Theme Preference"
              description="Follow shell theme toggle."
              control={<Input defaultValue="System default" readOnly aria-label="Theme preference" />}
            />
          </SettingsSectionCard>
        ) : null}

        {activeSection === SETTINGS_SECTION.USERS ? <SettingsUsersSection /> : null}
        {activeSection === SETTINGS_SECTION.ROLES ? <SettingsRolesSection /> : null}
        {activeSection === SETTINGS_SECTION.EXPENSES ? <SettingsExpensesSection /> : null}

        {activeSection === SETTINGS_SECTION.NOTIFICATIONS ? (
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
                  checked={data.emailNotificationsEnabled}
                  label="Email notifications"
                  disabled
                  onChange={() => undefined}
                />
              }
            />
            <SettingsSettingRow
              title="Payment Reminder Lead Time"
              description="Days before due date."
              control={
                <Input
                  defaultValue={`${data.paymentReminderDaysBefore} day before`}
                  readOnly
                  aria-label="Payment reminder lead time"
                />
              }
            />
            <SettingsSettingRow
              title="Supervisor Escalations"
              description="Variance and same-day edit alerts."
              control={<Switch checked label="Supervisor escalations" disabled onChange={() => undefined} />}
            />
          </SettingsSectionCard>
        ) : null}

        {activeSection === SETTINGS_SECTION.LOAN_RULES ? <LoanRulesSection settings={data} /> : null}
        {activeSection === SETTINGS_SECTION.SMS ? <SmsSection settings={data} /> : null}

        {activeSection === SETTINGS_SECTION.INTEGRATIONS ? (
          <SettingsSectionCard
            title="Integrations"
            description="External services and future API connectors."
            icon={<span aria-hidden="true">🔌</span>}
          >
            <SettingsSettingRow
              title="SMS Gateway"
              description="Hubtel SMS integration."
              control={<Input defaultValue="Connected" readOnly aria-label="SMS gateway" />}
            />
            <SettingsSettingRow
              title="Email Provider"
              description="Transactional email service."
              control={<Input defaultValue="Demo SMTP" readOnly aria-label="Email provider" />}
            />
            <SettingsSettingRow
              title="GPS Verification"
              description="Collection location verification."
              control={<Switch checked label="GPS verification" disabled onChange={() => undefined} />}
            />
          </SettingsSectionCard>
        ) : null}

        {activeSection === SETTINGS_SECTION.AUDIT ? (
          <SettingsSectionCard
            title="Audit & Logs"
            description="Monitoring, export, and retention controls."
            icon={<span aria-hidden="true">📋</span>}
          >
            <SettingsSettingRow
              title="Immutable Audit Trail"
              description="Prevent modification of audit records."
              control={<Switch checked label="Immutable audit trail" disabled onChange={() => undefined} />}
            />
            <SettingsSettingRow
              title="Audit Export"
              description="Allow compliance exports from audit log."
              control={<Switch checked label="Audit export" disabled onChange={() => undefined} />}
            />
            <SettingsSettingRow
              title="Monitoring Alerts"
              description="Notify admins on critical audit events."
              control={<Switch checked label="Monitoring alerts" disabled onChange={() => undefined} />}
            />
          </SettingsSectionCard>
        ) : null}
      </div>
    </div>
  );
}
