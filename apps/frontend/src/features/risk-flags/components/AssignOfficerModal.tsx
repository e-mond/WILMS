'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { riskFlagService } from '@/services';
import { cn } from '@/utils/cn';
import { resolveRiskFlagDisplayId } from '@/utils/entity-display-id';
import type { RiskFlagSummary } from '@/types/risk-flag';

export interface AssignOfficerModalProps {
  flag: RiskFlagSummary | null;
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (assignedToUserId: string) => void;
}

export function AssignOfficerModal({
  flag,
  isOpen,
  isSubmitting = false,
  onClose,
  onSubmit,
}: AssignOfficerModalProps) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSelectedUserId('');
      setQuery('');
      return;
    }
    if (flag?.assignedToUserId) {
      setSelectedUserId(flag.assignedToUserId);
    }
  }, [flag?.assignedToUserId, isOpen]);

  const assigneesQuery = useQuery({
    queryKey: ['risk-flags', 'assignees'],
    queryFn: () => riskFlagService.listRiskFlagAssignees(),
    enabled: isOpen,
  });

  const options = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = assigneesQuery.data ?? [];
    if (!needle) return rows;
    return rows.filter((user) =>
      [user.displayName, user.roleLabel, user.role, user.id]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [assigneesQuery.data, query]);

  const selected = (assigneesQuery.data ?? []).find((user) => user.id === selectedUserId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Officer"
      footer={
        <>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={isSubmitting || !selectedUserId}
            onClick={() => onSubmit(selectedUserId)}
          >
            Assign
          </Button>
        </>
      }
    >
      <div className="space-y-wilms-4">
        {flag ? (
          <p className="text-small text-text-muted">
            Assign review for{' '}
            <span className="font-semibold text-text-primary">{flag.entityName}</span>
            {' · '}
            {resolveRiskFlagDisplayId(flag)}
            {flag.assignedToName ? (
              <>
                . Currently assigned to{' '}
                <span className="font-semibold text-text-primary">{flag.assignedToName}</span>.
              </>
            ) : null}
          </p>
        ) : null}

        <div>
          <label htmlFor="assign-officer-search" className="text-small font-semibold text-text-primary">
            Find officer
          </label>
          <Input
            id="assign-officer-search"
            className="mt-wilms-2"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or role"
          />
          {selected ? (
            <p className="mt-wilms-2 rounded-xl border border-brand-primary/30 bg-brand-primary-light/40 px-wilms-3 py-wilms-2 text-small text-text-primary">
              Selected: <span className="font-semibold">{selected.displayName}</span>
              {' · '}
              {selected.roleLabel}
            </p>
          ) : null}
          <ul
            role="listbox"
            aria-label="Assignable officers"
            className="mt-wilms-2 max-h-56 space-y-1 overflow-y-auto rounded-xl border border-border/80 bg-background/70 p-wilms-2"
          >
            {assigneesQuery.isLoading ? (
              <li className="px-wilms-2 py-wilms-3 text-small text-text-muted">Loading officers…</li>
            ) : options.length === 0 ? (
              <li className="px-wilms-2 py-wilms-3 text-small text-text-muted">
                No matching active officers.
              </li>
            ) : (
              options.map((user) => {
                const isSelected = user.id === selectedUserId;
                return (
                  <li key={user.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={cn(
                        'w-full rounded-lg px-wilms-3 py-wilms-2 text-left transition-colors',
                        isSelected
                          ? 'bg-brand-primary-light text-brand-primary'
                          : 'hover:bg-card',
                      )}
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setQuery(user.displayName);
                      }}
                    >
                      <span className="block text-small font-semibold text-text-primary">
                        {user.displayName}
                      </span>
                      <span className="block text-xs text-text-muted">{user.roleLabel}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </Modal>
  );
}
