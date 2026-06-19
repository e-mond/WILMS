'use client';

import { useId, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface TabItem {
  id: string;
  label: string;
  panel: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  className?: string;
}

export function Tabs({ items, activeId, onChange, ariaLabel, className }: TabsProps) {
  const baseId = useId();

  return (
    <div className={cn('space-y-wilms-4', className)}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex flex-wrap gap-wilms-2 border-b border-border"
      >
        {items.map((item) => {
          const isActive = item.id === activeId;
          const tabId = `${baseId}-tab-${item.id}`;
          const panelId = `${baseId}-panel-${item.id}`;

          return (
            <button
              key={item.id}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              disabled={item.disabled}
              onClick={() => onChange(item.id)}
              className={cn(
                'rounded-t-sm border border-b-0 px-wilms-4 py-wilms-2 text-body font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:cursor-not-allowed disabled:opacity-50',
                isActive
                  ? 'border-border bg-card text-text-primary'
                  : 'border-transparent bg-transparent text-text-muted hover:text-text-primary',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) => {
        const isActive = item.id === activeId;
        const tabId = `${baseId}-tab-${item.id}`;
        const panelId = `${baseId}-panel-${item.id}`;

        return (
          <div
            key={item.id}
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            hidden={!isActive}
            className="text-text-primary"
          >
            {isActive ? item.panel : null}
          </div>
        );
      })}
    </div>
  );
}
