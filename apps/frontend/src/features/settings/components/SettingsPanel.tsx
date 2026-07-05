'use client';

import { useMemo, useState } from 'react';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import {
  buildSettingsExportDocument,
  useWilmsExportActor,
  WilmsExportActions,
} from '@/features/export';
import { SettingsAsidePanel } from '@/features/settings/components/SettingsAsidePanel';
import { SettingsUsersSection } from '@/features/settings/components/SettingsUsersSection';
import { SettingsRolesSection } from '@/features/settings/components/SettingsRolesSection';
import { SettingsExpensesSection } from '@/features/settings/components/SettingsExpensesSection';
import {
  AuditSectionView,
  IntegrationsSectionView,
  LoanRulesSectionView,
  MyAccountSectionView,
  NotificationsSectionView,
  OrganisationSectionView,
  SecuritySectionView,
  SmsSectionView,
} from '@/features/settings/components/SettingsSectionViews';
import {
  SETTINGS_SECTION,
  SETTINGS_SECTIONS,
  type SettingsSection,
} from '@/constants/settings-sections';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { useShellAsideContent } from '@/hooks/useShellAsideContent';
import { cn } from '@/utils/cn';

export function SettingsPanel() {
  const { data, isLoading, isError, error, refetch } = useSettings();
  const generatedBy = useWilmsExportActor();
  const [activeSection, setActiveSection] = useState<SettingsSection>(SETTINGS_SECTION.ORGANISATION);

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

  const exportDocument = useMemo(
    () =>
      data
        ? buildSettingsExportDocument({
            settings: data,
            users: [],
            generatedBy,
            activeSectionLabel,
          })
        : null,
    [activeSectionLabel, data, generatedBy],
  );

  return (
    <QueryStatePanel
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={() => void refetch()}
      variant="inline"
    >
      {data ? (
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
            {exportDocument ? (
              <div className="flex justify-end">
                <WilmsExportActions
                  document={exportDocument}
                  filenameBase="system-settings"
                  showIcons
                  permissions={[]}
                />
              </div>
            ) : null}
            {activeSection === SETTINGS_SECTION.ORGANISATION ? (
              <OrganisationSectionView settings={data} />
            ) : null}
            {activeSection === SETTINGS_SECTION.MY_ACCOUNT ? <MyAccountSectionView /> : null}
            {activeSection === SETTINGS_SECTION.USERS ? <SettingsUsersSection /> : null}
            {activeSection === SETTINGS_SECTION.ROLES ? <SettingsRolesSection /> : null}
            {activeSection === SETTINGS_SECTION.EXPENSES ? <SettingsExpensesSection /> : null}
            {activeSection === SETTINGS_SECTION.SECURITY ? <SecuritySectionView settings={data} /> : null}
            {activeSection === SETTINGS_SECTION.NOTIFICATIONS ? (
              <NotificationsSectionView settings={data} />
            ) : null}
            {activeSection === SETTINGS_SECTION.LOAN_RULES ? (
              <LoanRulesSectionView settings={data} />
            ) : null}
            {activeSection === SETTINGS_SECTION.SMS ? <SmsSectionView settings={data} /> : null}
            {activeSection === SETTINGS_SECTION.INTEGRATIONS ? (
              <IntegrationsSectionView settings={data} />
            ) : null}
            {activeSection === SETTINGS_SECTION.AUDIT ? <AuditSectionView settings={data} /> : null}
          </div>
        </div>
      ) : null}
    </QueryStatePanel>
  );
}
