'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { borrowerService, communicationService, groupService } from '@/services';
import type { AudiencePreviewResult, AudienceType } from '@/types/communication';

export const AUDIENCE_OPTIONS: { value: AudienceType; label: string }[] = [
  { value: 'ALL_USERS', label: 'All staff users' },
  { value: 'ALL_BORROWERS', label: 'All borrowers' },
  { value: 'ALL_COLLECTORS', label: 'All collectors' },
  { value: 'ALL_OFFICERS', label: 'All registration officers' },
  { value: 'ALL_APPROVERS', label: 'All approvers' },
  { value: 'ALL_AUDITORS', label: 'All auditors' },
  { value: 'ALL_ADMINS', label: 'All Super Admins' },
  { value: 'ALL_GROUP_LEADERS', label: 'All group leaders' },
  { value: 'SPECIFIC_BORROWERS', label: 'Selected borrowers' },
  { value: 'SPECIFIC_GROUP', label: 'One group (members)' },
  { value: 'SPECIFIC_GROUPS', label: 'Selected groups' },
  { value: 'CUSTOM', label: 'Custom mixed audience' },
];

export interface AudienceComposerValue {
  audienceType: AudienceType;
  audienceFilter?: Record<string, unknown>;
}

interface AudienceComposerProps {
  value: AudienceComposerValue;
  onChange: (value: AudienceComposerValue) => void;
  preview: AudiencePreviewResult | null;
  onRequestPreview: () => void;
  previewPending?: boolean;
}

export function AudienceComposer({
  value,
  onChange,
  preview,
  onRequestPreview,
  previewPending,
}: AudienceComposerProps) {
  const [borrowerSearch, setBorrowerSearch] = useState('');
  const [segmentName, setSegmentName] = useState('');
  const selectedBorrowerIds = useMemo(
    () =>
      Array.isArray(value.audienceFilter?.borrowerIds)
        ? (value.audienceFilter?.borrowerIds as string[])
        : [],
    [value.audienceFilter],
  );
  const selectedGroupIds = useMemo(
    () =>
      Array.isArray(value.audienceFilter?.groupIds)
        ? (value.audienceFilter?.groupIds as string[])
        : value.audienceFilter?.groupId
          ? [String(value.audienceFilter.groupId)]
          : [],
    [value.audienceFilter],
  );
  const leaderOnly = Boolean(value.audienceFilter?.leaderOnly);

  const borrowersQuery = useQuery({
    queryKey: ['communications', 'borrowers-picker'],
    queryFn: () => borrowerService.listBorrowers(),
  });
  const groupsQuery = useQuery({
    queryKey: ['communications', 'groups-picker'],
    queryFn: () => groupService.listGroups(),
  });
  const segmentsQuery = useQuery({
    queryKey: ['communications', 'audience-segments'],
    queryFn: () => communicationService.listAudienceSegments(),
  });

  const filteredBorrowers = useMemo(() => {
    const rows = borrowersQuery.data ?? [];
    const q = borrowerSearch.trim().toLowerCase();
    if (!q) {
      return rows.slice(0, 40);
    }
    return rows
      .filter(
        (row) =>
          row.fullName.toLowerCase().includes(q) ||
            row.phone?.toLowerCase().includes(q) ||
          row.groupName?.toLowerCase().includes(q),
      )
      .slice(0, 40);
  }, [borrowerSearch, borrowersQuery.data]);

  const groups = groupsQuery.data?.groups ?? [];
  const groupList = groups;

  useEffect(() => {
    onRequestPreview();
    // Preview when audience selection changes; parent stabilizes callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional audience-driven refresh
  }, [value.audienceType, JSON.stringify(value.audienceFilter ?? {})]);

  function setType(audienceType: AudienceType) {
    onChange({ audienceType, audienceFilter: undefined });
  }

  function toggleBorrower(borrowerId: string, label: string) {
    void label;
    const next = selectedBorrowerIds.includes(borrowerId)
      ? selectedBorrowerIds.filter((id) => id !== borrowerId)
      : [...selectedBorrowerIds, borrowerId];
    onChange({
      audienceType:
        value.audienceType === 'CUSTOM' ? 'CUSTOM' : 'SPECIFIC_BORROWERS',
      audienceFilter: { ...value.audienceFilter, borrowerIds: next },
    });
  }

  function toggleGroup(groupId: string) {
    if (value.audienceType === 'SPECIFIC_GROUP') {
      onChange({
        audienceType: 'SPECIFIC_GROUP',
        audienceFilter: { groupId, leaderOnly },
      });
      return;
    }
    const next = selectedGroupIds.includes(groupId)
      ? selectedGroupIds.filter((id) => id !== groupId)
      : [...selectedGroupIds, groupId];
    onChange({
      audienceType: value.audienceType === 'CUSTOM' ? 'CUSTOM' : 'SPECIFIC_GROUPS',
      audienceFilter: { ...value.audienceFilter, groupIds: next, leaderOnly },
    });
  }

  async function saveSegment() {
    if (!segmentName.trim()) {
      return;
    }
    await communicationService.createAudienceSegment({
      name: segmentName.trim(),
      audienceType: value.audienceType,
      audienceFilter: value.audienceFilter,
    });
    setSegmentName('');
    void segmentsQuery.refetch();
  }

  const needsBorrowerPicker =
    value.audienceType === 'SPECIFIC_BORROWERS' || value.audienceType === 'CUSTOM';
  const needsGroupPicker =
    value.audienceType === 'SPECIFIC_GROUP' ||
    value.audienceType === 'SPECIFIC_GROUPS' ||
    value.audienceType === 'CUSTOM';

  return (
    <div className="space-y-wilms-3">
      <div>
        <label className="mb-wilms-2 block text-small font-medium text-text-primary">Audience</label>
        <Select
          value={value.audienceType}
          onChange={(e) => setType(e.target.value as AudienceType)}
          aria-label="Audience"
        >
          {AUDIENCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {(segmentsQuery.data?.length ?? 0) > 0 ? (
        <div>
          <label className="mb-wilms-2 block text-small font-medium text-text-primary">
            Saved segment
          </label>
          <Select
            value=""
            onChange={(e) => {
              const segment = segmentsQuery.data?.find((entry) => entry.id === e.target.value);
              if (!segment) return;
              onChange({
                audienceType: segment.audienceType,
                audienceFilter: segment.audienceFilter,
              });
            }}
            aria-label="Saved audience segment"
          >
            <option value="">Load a saved segment…</option>
            {segmentsQuery.data?.map((segment) => (
              <option key={segment.id} value={segment.id}>
                {segment.name}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      {needsBorrowerPicker ? (
        <div className="space-y-wilms-2">
          <Input
            value={borrowerSearch}
            onChange={(e) => setBorrowerSearch(e.target.value)}
            placeholder="Search borrowers…"
            aria-label="Search borrowers"
          />
          <div className="flex flex-wrap gap-wilms-2">
            {selectedBorrowerIds.map((id) => {
              const borrower = (borrowersQuery.data ?? []).find((row) => row.id === id);
              return (
                <Badge key={id} variant="default">
                  <button type="button" onClick={() => toggleBorrower(id, borrower?.fullName ?? id)}>
                    {borrower?.fullName ?? id} ×
                  </button>
                </Badge>
              );
            })}
          </div>
          <div className="max-h-40 overflow-y-auto rounded-sm border border-border p-wilms-2">
            {filteredBorrowers.map((borrower) => (
              <label key={borrower.id} className="flex items-center gap-wilms-2 py-1 text-small">
                <input
                  type="checkbox"
                  checked={selectedBorrowerIds.includes(borrower.id)}
                  onChange={() => toggleBorrower(borrower.id, borrower.fullName)}
                />
                <span>
                  {borrower.fullName}
                  <span className="text-text-muted"> · {borrower.groupName}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {needsGroupPicker ? (
        <div className="space-y-wilms-2">
          <label className="flex items-center gap-wilms-2 text-small">
            <input
              type="checkbox"
              checked={leaderOnly}
              onChange={(e) =>
                onChange({
                  ...value,
                  audienceFilter: {
                    ...value.audienceFilter,
                    ...(value.audienceType === 'SPECIFIC_GROUP'
                      ? { groupId: selectedGroupIds[0] }
                      : { groupIds: selectedGroupIds }),
                    leaderOnly: e.target.checked,
                  },
                })
              }
            />
            Group leaders only
          </label>
          <div className="max-h-40 overflow-y-auto rounded-sm border border-border p-wilms-2">
            {groupList.map((group: { id: string; name?: string; displayName?: string }) => (
              <label key={group.id} className="flex items-center gap-wilms-2 py-1 text-small">
                <input
                  type={value.audienceType === 'SPECIFIC_GROUP' ? 'radio' : 'checkbox'}
                  name="group-picker"
                  checked={selectedGroupIds.includes(group.id)}
                  onChange={() => toggleGroup(group.id)}
                />
                <span>{group.displayName ?? group.name ?? group.id}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-sm border border-border bg-surface-muted/40 p-wilms-3">
        <div className="flex items-center justify-between gap-wilms-2">
          <p className="text-small font-medium text-text-primary">
            Audience preview{previewPending ? '…' : ''}
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={onRequestPreview}>
            Refresh
          </Button>
        </div>
        <p className="mt-wilms-1 text-small text-text-muted">
          {preview ? `${preview.total} recipient(s)` : 'Select an audience to preview.'}
          {preview?.channelsHint?.length
            ? ` · Channels: ${preview.channelsHint.join(', ')}`
            : ''}
        </p>
        {preview?.sample?.length ? (
          <ul className="mt-wilms-2 space-y-1 text-small text-text-primary">
            {preview.sample.slice(0, 8).map((entry) => (
              <li key={`${entry.userId ?? ''}-${entry.borrowerId ?? ''}-${entry.displayName}`}>
                {entry.displayName}
                {entry.phone ? ` · ${entry.phone}` : ''}
                {entry.email ? ` · ${entry.email}` : ''}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end gap-wilms-2">
        <div className="min-w-[12rem] flex-1">
          <label className="mb-wilms-2 block text-small font-medium text-text-primary">
            Save as segment
          </label>
          <Input
            value={segmentName}
            onChange={(e) => setSegmentName(e.target.value)}
            placeholder="Segment name"
            aria-label="Segment name"
          />
        </div>
        <Button type="button" variant="secondary" onClick={() => void saveSegment()}>
          Save
        </Button>
      </div>
    </div>
  );
}
