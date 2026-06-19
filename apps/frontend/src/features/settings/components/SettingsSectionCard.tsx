'use client';

import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface SettingsSettingRowProps {
  title: string;
  description: string;
  control: ReactNode;
  className?: string;
}

export function SettingsSettingRow({ title, description, control, className }: SettingsSettingRowProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-wilms-3 border-b border-border py-wilms-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-text-primary">{title}</p>
        <p className="mt-wilms-1 text-small text-text-muted">{description}</p>
      </div>
      <div className="shrink-0 sm:min-w-[180px]">{control}</div>
    </div>
  );
}

export interface SettingsSectionCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SettingsSectionCard({
  title,
  description,
  icon,
  actions,
  children,
  className,
}: SettingsSectionCardProps) {
  return (
    <section className={cn('rounded-sm border border-border bg-card p-wilms-4', className)}>
      <div className="flex flex-wrap items-start justify-between gap-wilms-3">
        <div className="flex min-w-0 items-start gap-wilms-3">
          {icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-brand-primary-light text-executive-gold">
              {icon}
            </div>
          ) : null}
          <div>
            <h2 className="text-heading-2 font-semibold text-text-primary">{title}</h2>
            <p className="mt-wilms-1 text-small text-text-muted">{description}</p>
          </div>
        </div>
        {actions}
      </div>
      <div className="mt-wilms-2">{children}</div>
    </section>
  );
}

function SettingsLockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function SettingsUsersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 11h5M18.5 8.5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SettingsRulesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M7 4h10v16H7z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SettingsSmsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M6 5h12v10H9l-3 3V5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export const SETTINGS_SECTION_ICONS = {
  security: SettingsLockIcon,
  users: SettingsUsersIcon,
  loanRules: SettingsRulesIcon,
  sms: SettingsSmsIcon,
};
