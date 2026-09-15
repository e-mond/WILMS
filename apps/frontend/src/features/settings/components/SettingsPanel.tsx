'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardList,
  KeyRound,
  Lock,
  MessageSquare,
  Plug,
  RefreshCw,
  Ruler,
  Shield,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { Select } from '@/components/ui/Select';
import {
  buildSettingsExportDocument,
  useWilmsExportActor,
  WilmsExportActions,
} from '@/features/export';
import { SettingsAsidePanel } from '@/features/settings/components/SettingsAsidePanel';
import { SettingsUsersSection } from '@/features/settings/components/SettingsUsersSection';
import { SettingsRolesSection } from '@/features/settings/components/SettingsRolesSection';
import { SettingsHolidaysSection } from '@/features/settings/components/SettingsHolidaysSection';
import { SettingsAutomationSection } from '@/features/settings/components/SettingsAutomationSection';
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
import { DocumentationSettingsSection } from '@/features/settings/components/DocumentationSettingsSection';
import {
  SETTINGS_SECTION,
  SETTINGS_SECTIONS,
  type SettingsSection,
} from '@/constants/settings-sections';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { useShellAsideContent } from '@/hooks/useShellAsideContent';
import { cn } from '@/utils/cn';

const SECTION_ICONS: Partial<Record<SettingsSection, LucideIcon>> = {
  [SETTINGS_SECTION.ORGANISATION]: Building2,
  [SETTINGS_SECTION.MY_ACCOUNT]: User,
  [SETTINGS_SECTION.USERS]: Users,
  [SETTINGS_SECTION.ROLES]: Shield,
  [SETTINGS_SECTION.HOLIDAYS]: CalendarDays,
  [SETTINGS_SECTION.AUTOMATION]: RefreshCw,
  [SETTINGS_SECTION.SECURITY]: Lock,
  [SETTINGS_SECTION.NOTIFICATIONS]: Bell,
  [SETTINGS_SECTION.LOAN_RULES]: Ruler,
  [SETTINGS_SECTION.SMS]: MessageSquare,
  [SETTINGS_SECTION.INTEGRATIONS]: Plug,
  [SETTINGS_SECTION.AUDIT]: ClipboardList,
  [SETTINGS_SECTION.DOCUMENTATION]: BookOpen,
  [SETTINGS_SECTION.DATA_EXPORTS]: KeyRound,
};

function resolveSettingsSection(value: string | null): SettingsSection {
  const match = SETTINGS_SECTIONS.find((section) => section.id === value);
  return match?.id ?? SETTINGS_SECTION.ORGANISATION;
}

export function SettingsPanel() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useSettings();
  const generatedBy = useWilmsExportActor();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<SettingsSection>(() =>
    resolveSettingsSection(searchParams.get('section')),
  );

  useEffect(() => {
    setActiveSection(resolveSettingsSection(searchParams.get('section')));
  }, [searchParams]);

  function selectSection(section: SettingsSection) {
    setActiveSection(section);
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', section);
    router.replace(`/settings?${params.toString()}`, { scroll: false });
  }

  const activeSectionMeta =
    SETTINGS_SECTIONS.find((section) => section.id === activeSection) ?? SETTINGS_SECTIONS[0]!;
  const activeSectionLabel = activeSectionMeta.label;

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
        <div className="space-y-wilms-5" data-testid="settings-panel">
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card">
            <div className="bg-gradient-to-br from-brand-primary/[0.07] via-transparent to-transparent px-wilms-5 py-wilms-5 sm:px-wilms-6">
              <div className="flex flex-col gap-wilms-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <p className="text-small font-semibold uppercase tracking-wide text-brand-primary">
                    System configuration
                  </p>
                  <h1 className="mt-wilms-1 text-heading-1 font-semibold text-text-primary">
                    Settings
                  </h1>
                  <p className="mt-wilms-1 max-w-2xl text-small text-text-muted">
                    Manage organisation defaults, users, loan rules, notifications, and security
                    controls.
                  </p>
                </div>
                {exportDocument ? (
                  <div className="w-full shrink-0 sm:w-auto">
                    <WilmsExportActions
                      document={exportDocument}
                      filenameBase="WILMS_System_Settings"
                      showIcons
                      permissions={[]}
                      className="flex w-full flex-wrap gap-2 [&_button]:min-h-[44px] [&_button]:flex-1 sm:[&_button]:flex-none"
                    />
                  </div>
                ) : null}
              </div>
              <div className="mt-wilms-4 inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-3 py-2 text-small">
                <span className="font-semibold text-text-primary">{activeSectionLabel}</span>
                <span className="text-text-muted">· active section</span>
              </div>
            </div>
          </div>

          <div className="grid gap-wilms-4 xl:grid-cols-[240px_minmax(0,1fr)]">
            <div className="xl:self-start">
              <div className="rounded-xl border border-border/80 bg-card p-wilms-3 xl:hidden">
                <label
                  htmlFor="settings-configuration-section"
                  className="mb-wilms-2 block text-[11px] font-semibold uppercase tracking-wide text-text-muted"
                >
                  Configuration
                </label>
                <Select
                  id="settings-configuration-section"
                  aria-label="Settings configuration section"
                  value={activeSection}
                  className="min-h-[44px] h-11 rounded-lg"
                  onChange={(event) =>
                    selectSection(resolveSettingsSection(event.target.value))
                  }
                >
                  {SETTINGS_SECTIONS.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.label}
                    </option>
                  ))}
                </Select>
              </div>

              <nav
                aria-label="Settings categories"
                className="hidden rounded-xl border border-border/80 bg-card p-wilms-2 xl:block"
              >
                <p className="px-wilms-3 pb-wilms-2 pt-wilms-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  Configuration
                </p>
                <ul className="space-y-0.5">
                  {SETTINGS_SECTIONS.map((section) => {
                    const Icon = SECTION_ICONS[section.id];
                    const active = activeSection === section.id;
                    return (
                      <li key={section.id}>
                        <button
                          type="button"
                          className={cn(
                            'inline-flex w-full min-h-[40px] items-center gap-2 rounded-lg px-wilms-3 py-wilms-2 text-left text-small font-semibold transition-colors',
                            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary',
                            active
                              ? 'bg-brand-primary/10 text-brand-primary'
                              : 'text-text-muted hover:bg-background hover:text-text-primary',
                          )}
                          aria-current={active ? 'page' : undefined}
                          onClick={() => selectSection(section.id)}
                        >
                          {Icon ? (
                            <Icon
                              className={cn('h-4 w-4 shrink-0', active ? 'text-brand-primary' : '')}
                              aria-hidden="true"
                            />
                          ) : null}
                          <span>{section.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>

            <div
              role="region"
              aria-label={`${activeSectionLabel} settings`}
              className="min-w-0 space-y-wilms-4"
            >
              {activeSection === SETTINGS_SECTION.ORGANISATION ? (
                <OrganisationSectionView settings={data} />
              ) : null}
              {activeSection === SETTINGS_SECTION.MY_ACCOUNT ? <MyAccountSectionView /> : null}
              {activeSection === SETTINGS_SECTION.USERS ? <SettingsUsersSection /> : null}
              {activeSection === SETTINGS_SECTION.ROLES ? <SettingsRolesSection /> : null}
              {activeSection === SETTINGS_SECTION.HOLIDAYS ? <SettingsHolidaysSection /> : null}
              {activeSection === SETTINGS_SECTION.AUTOMATION ? (
                <SettingsAutomationSection />
              ) : null}
              {activeSection === SETTINGS_SECTION.SECURITY ? (
                <SecuritySectionView settings={data} />
              ) : null}
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
              {activeSection === SETTINGS_SECTION.AUDIT ? (
                <AuditSectionView settings={data} />
              ) : null}
              {activeSection === SETTINGS_SECTION.DOCUMENTATION ? (
                <DocumentationSettingsSection />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </QueryStatePanel>
  );
}
