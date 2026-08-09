'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { borrowerService, groupService } from '@/services';
import { FLAG_ENTITY_TYPE, FLAG_TYPE } from '@/types/risk-flag';
import { resolveGroupDisplayId, formatBorrowerDisplayId } from '@/utils/entity-display-id';
import { cn } from '@/utils/cn';

export interface RaiseFlagFormValues {
  entityId: string;
  entityName: string;
  entityType: string;
  flagType: string;
  community: string;
}

export interface RaiseFlagModalProps {
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: RaiseFlagFormValues) => void;
}

interface EntityOption {
  id: string;
  label: string;
  secondary: string;
  community: string;
}

export function RaiseFlagModal({
  isOpen,
  isSubmitting = false,
  onClose,
  onSubmit,
}: RaiseFlagModalProps) {
  const [entityId, setEntityId] = useState('');
  const [entityName, setEntityName] = useState('');
  const [entityType, setEntityType] = useState<string>(FLAG_ENTITY_TYPE.BORROWER);
  const [flagType, setFlagType] = useState<string>(FLAG_TYPE.MISSED_PAYMENT);
  const [community, setCommunity] = useState('');
  const [query, setQuery] = useState('');

  const borrowersQuery = useQuery({
    queryKey: ['risk-flags', 'raise', 'borrowers'],
    queryFn: () => borrowerService.listBorrowers(),
    enabled: isOpen && entityType === FLAG_ENTITY_TYPE.BORROWER,
  });

  const groupsQuery = useQuery({
    queryKey: ['risk-flags', 'raise', 'groups'],
    queryFn: () => groupService.listGroups(),
    enabled: isOpen && entityType === FLAG_ENTITY_TYPE.GROUP,
  });

  const applicationsQuery = useQuery({
    queryKey: ['risk-flags', 'raise', 'applications'],
    queryFn: () => borrowerService.listPendingApplications(),
    enabled: isOpen && entityType === FLAG_ENTITY_TYPE.APPLICATION,
  });

  const options = useMemo((): EntityOption[] => {
    if (entityType === FLAG_ENTITY_TYPE.BORROWER) {
      return (borrowersQuery.data ?? []).map((borrower) => ({
        id: borrower.id,
        label: borrower.fullName,
        secondary: [
          borrower.phone,
          borrower.groupName,
          borrower.displayId ?? formatBorrowerDisplayId({ id: borrower.id, community: '', registeredAt: '' }),
        ]
          .filter(Boolean)
          .join(' · '),
        community: borrower.groupName,
      }));
    }

    if (entityType === FLAG_ENTITY_TYPE.GROUP) {
      return (groupsQuery.data?.groups ?? []).map((group) => ({
        id: group.id,
        label: group.displayName || group.name,
        secondary: [
          group.community,
          resolveGroupDisplayId({ id: group.id, groupSystemId: group.groupSystemId }),
          `${group.memberCount} members`,
        ]
          .filter(Boolean)
          .join(' · '),
        community: group.community,
      }));
    }

    return (applicationsQuery.data ?? []).map((application) => ({
      id: application.id,
      label: application.fullName,
      secondary: [application.phone, application.community, application.registeredByOfficerName]
        .filter(Boolean)
        .join(' · '),
      community: application.community ?? '',
    }));
  }, [
    applicationsQuery.data,
    borrowersQuery.data,
    entityType,
    groupsQuery.data?.groups,
  ]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options.slice(0, 12);
    return options
      .filter((option) =>
        [option.label, option.secondary, option.community, option.id]
          .join(' ')
          .toLowerCase()
          .includes(needle),
      )
      .slice(0, 12);
  }, [options, query]);

  const resetEntitySelection = () => {
    setEntityId('');
    setEntityName('');
    setCommunity('');
    setQuery('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Raise Flag"
      footer={
        <>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={isSubmitting || !entityId.trim() || !entityName.trim() || !community.trim()}
            onClick={() =>
              onSubmit({
                entityId: entityId.trim(),
                entityName: entityName.trim(),
                entityType,
                flagType,
                community: community.trim(),
              })
            }
          >
            Raise Flag
          </Button>
        </>
      }
    >
      <div className="space-y-wilms-4">
        <div>
          <label htmlFor="raise-flag-type" className="text-small font-semibold text-text-primary">
            Entity type
          </label>
          <Select
            id="raise-flag-type"
            className="mt-wilms-2"
            value={entityType}
            onChange={(event) => {
              setEntityType(event.target.value);
              resetEntitySelection();
            }}
          >
            <option value={FLAG_ENTITY_TYPE.BORROWER}>Borrower</option>
            <option value={FLAG_ENTITY_TYPE.GROUP}>Group</option>
            <option value={FLAG_ENTITY_TYPE.APPLICATION}>Application</option>
          </Select>
        </div>

        <div>
          <label htmlFor="raise-flag-entity-search" className="text-small font-semibold text-text-primary">
            Find entity
          </label>
          <Input
            id="raise-flag-entity-search"
            className="mt-wilms-2"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, phone, group, or reference"
            aria-autocomplete="list"
            aria-controls="raise-flag-entity-results"
          />
          {entityName ? (
            <p className="mt-wilms-2 rounded-xl border border-brand-primary/30 bg-brand-primary-light/40 px-wilms-3 py-wilms-2 text-small text-text-primary">
              Selected: <span className="font-semibold">{entityName}</span>
              {community ? ` · ${community}` : ''}
            </p>
          ) : null}
          <ul
            id="raise-flag-entity-results"
            role="listbox"
            aria-label="Matching entities"
            className="mt-wilms-2 max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border/80 bg-background/70 p-wilms-2"
          >
            {filtered.length === 0 ? (
              <li className="px-wilms-2 py-wilms-3 text-small text-text-muted">
                {borrowersQuery.isLoading || groupsQuery.isLoading || applicationsQuery.isLoading
                  ? 'Loading…'
                  : 'No matching entities. Adjust your search.'}
              </li>
            ) : (
              filtered.map((option) => {
                const selected = option.id === entityId;
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={cn(
                        'w-full rounded-lg px-wilms-3 py-wilms-2 text-left transition-colors',
                        selected
                          ? 'bg-brand-primary-light text-brand-primary'
                          : 'hover:bg-card',
                      )}
                      onClick={() => {
                        setEntityId(option.id);
                        setEntityName(option.label);
                        setCommunity(option.community || '—');
                        setQuery(option.label);
                      }}
                    >
                      <span className="block text-small font-semibold text-text-primary">
                        {option.label}
                      </span>
                      <span className="block text-xs text-text-muted">{option.secondary}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <div>
          <label htmlFor="raise-flag-reason" className="text-small font-semibold text-text-primary">
            Flag type
          </label>
          <Select
            id="raise-flag-reason"
            className="mt-wilms-2"
            value={flagType}
            onChange={(event) => setFlagType(event.target.value)}
          >
            <option value={FLAG_TYPE.MISSED_PAYMENT}>Missed Payment</option>
            <option value={FLAG_TYPE.DEFAULT}>Default</option>
            <option value={FLAG_TYPE.FRAUD_SUSPICION}>Fraud Suspicion</option>
            <option value={FLAG_TYPE.DUPLICATE_ID}>Duplicate ID</option>
          </Select>
        </div>

        <div>
          <label htmlFor="raise-flag-community" className="text-small font-semibold text-text-primary">
            Community
          </label>
          <Input
            id="raise-flag-community"
            className="mt-wilms-2"
            value={community}
            onChange={(event) => setCommunity(event.target.value)}
            placeholder="Filled from selected entity"
          />
        </div>
      </div>
    </Modal>
  );
}
