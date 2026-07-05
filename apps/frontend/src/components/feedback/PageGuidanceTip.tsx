'use client';

import { useId, useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface PageGuidanceTipProps {
  title: string;
  body: string;
  example?: string;
  className?: string;
}

export function PageGuidanceTip({ title, body, example, className }: PageGuidanceTipProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className={cn('rounded-sm border border-border bg-background/80 p-wilms-3', className)}>
      <button
        type="button"
        className="flex w-full items-start gap-wilms-2 text-left"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" aria-hidden="true" />
        <span className="text-small font-semibold text-text-primary">{title}</span>
      </button>
      {open ? (
        <div id={panelId} className="mt-wilms-2 space-y-wilms-2 pl-6 text-small text-text-muted">
          <p>{body}</p>
          {example ? (
            <p>
              <span className="font-semibold text-text-primary">Example: </span>
              {example}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
