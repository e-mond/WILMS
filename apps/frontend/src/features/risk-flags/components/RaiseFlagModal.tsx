'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { FLAG_ENTITY_TYPE, FLAG_TYPE } from '@/types/risk-flag';

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
          <label htmlFor="raise-flag-entity-id" className="text-small font-semibold text-text-primary">
            Entity ID
          </label>
          <Input
            id="raise-flag-entity-id"
            className="mt-wilms-2"
            value={entityId}
            onChange={(event) => setEntityId(event.target.value)}
            placeholder="UUID of borrower, group, or application"
          />
        </div>
        <div>
          <label htmlFor="raise-flag-entity" className="text-small font-semibold text-text-primary">
            Entity name
          </label>
          <Input
            id="raise-flag-entity"
            className="mt-wilms-2"
            value={entityName}
            onChange={(event) => setEntityName(event.target.value)}
            placeholder="Borrower or group name"
          />
        </div>
        <div>
          <label htmlFor="raise-flag-type" className="text-small font-semibold text-text-primary">
            Entity type
          </label>
          <Select
            id="raise-flag-type"
            className="mt-wilms-2"
            value={entityType}
            onChange={(event) => setEntityType(event.target.value)}
          >
            <option value={FLAG_ENTITY_TYPE.BORROWER}>Borrower</option>
            <option value={FLAG_ENTITY_TYPE.GROUP}>Group</option>
            <option value={FLAG_ENTITY_TYPE.APPLICATION}>Application</option>
          </Select>
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
            placeholder="Madina"
          />
        </div>
      </div>
    </Modal>
  );
}
