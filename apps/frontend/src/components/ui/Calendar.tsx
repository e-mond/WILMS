'use client';

import { useMemo } from 'react';
import { cn } from '@/utils/cn';

export interface CalendarDayMarker {
  iso: string;
  tone?: 'brand' | 'info' | 'success' | 'warning' | 'danger' | 'muted';
}

interface CalendarProps {
  month: string; // YYYY-MM
  selectedDate?: string | null;
  onSelectDate?: (iso: string) => void;
  onMonthChange?: (month: string) => void;
  markers?: CalendarDayMarker[];
  className?: string;
}

function shiftMonth(month: string, delta: number): string {
  const [year, mon] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year!, (mon ?? 1) - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

const TONE_DOT: Record<NonNullable<CalendarDayMarker['tone']>, string> = {
  brand: 'bg-brand-primary',
  info: 'bg-status-info',
  success: 'bg-status-active',
  warning: 'bg-status-at-risk',
  danger: 'bg-danger',
  muted: 'bg-text-muted',
};

export function Calendar({
  month,
  selectedDate,
  onSelectDate,
  onMonthChange,
  markers = [],
  className,
}: CalendarProps) {
  const markerMap = useMemo(() => {
    const map = new Map<string, CalendarDayMarker['tone']>();
    for (const marker of markers) {
      map.set(marker.iso, marker.tone ?? 'brand');
    }
    return map;
  }, [markers]);

  const cells = useMemo(() => {
    const [year, mon] = month.split('-').map(Number);
    const first = new Date(Date.UTC(year!, (mon ?? 1) - 1, 1));
    const daysInMonth = new Date(Date.UTC(year!, mon!, 0)).getUTCDate();
    const startPad = first.getUTCDay();
    const result: Array<{ key: string; label: string; iso: string | null }> = [];
    for (let i = 0; i < startPad; i += 1) {
      result.push({ key: `pad-${i}`, label: '', iso: null });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const iso = `${year}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      result.push({ key: iso, label: String(day), iso });
    }
    return result;
  }, [month]);

  const title = useMemo(() => {
    const [year, mon] = month.split('-').map(Number);
    return new Date(Date.UTC(year!, (mon ?? 1) - 1, 1)).toLocaleString('en-GB', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }, [month]);

  return (
    <div className={cn('rounded-2xl border border-border/70 bg-card/90 p-wilms-4 shadow-sm backdrop-blur', className)}>
      <div className="mb-wilms-3 flex items-center justify-between gap-wilms-2">
        <button
          type="button"
          className="rounded-full px-3 py-1 text-small font-semibold text-text-muted hover:bg-surface"
          onClick={() => onMonthChange?.(shiftMonth(month, -1))}
          aria-label="Previous month"
        >
          ‹
        </button>
        <h3 className="text-heading-3 font-semibold text-text-primary">{title}</h3>
        <button
          type="button"
          className="rounded-full px-3 py-1 text-small font-semibold text-text-muted hover:bg-surface"
          onClick={() => onMonthChange?.(shiftMonth(month, 1))}
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-caption text-text-muted">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, index) => (
          <div key={`${label}-${index}`} className="py-1 font-semibold">
            {label}
          </div>
        ))}
        {cells.map((cell) => {
          const tone = cell.iso ? markerMap.get(cell.iso) : undefined;
          const selected = cell.iso && selectedDate === cell.iso;
          return (
            <button
              key={cell.key}
              type="button"
              disabled={!cell.iso}
              onClick={() => cell.iso && onSelectDate?.(cell.iso)}
              className={cn(
                'relative flex min-h-10 flex-col items-center justify-center rounded-xl text-small transition-colors',
                cell.iso ? 'text-text-primary hover:bg-brand-primary-light/50' : 'opacity-0',
                selected && 'bg-brand-primary text-card hover:bg-brand-primary',
              )}
            >
              {cell.label}
              {tone ? (
                <span
                  className={cn(
                    'absolute bottom-1 h-1 w-1 rounded-full',
                    selected ? 'bg-card' : TONE_DOT[tone],
                  )}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
