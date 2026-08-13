'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Alert } from '@/components/feedback/Alert';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermissions';
import { PERMISSION } from '@/constants/permissions';
import { BORROWER_GENDER, BORROWER_ID_TYPE } from '@/constants/borrower-registration';
import type { BorrowerIdType, BorrowerGender } from '@/constants/borrower-registration';
import { borrowerService } from '@/services';
import { notifyMutationError, notifyMutationSuccess } from '@/utils/mutation-feedback';
import { useQueryClient } from '@tanstack/react-query';
import { borrowersQueryKey } from '@/features/borrower-management/hooks/useBorrowers';

const TEMPLATE_HEADERS = [
  'fullName',
  'phone',
  'idType',
  'idNumber',
  'dateOfBirth',
  'gender',
  'houseAddress',
  'community',
  'region',
  'district',
  'businessName',
  'typeOfWork',
  'guarantorName',
  'guarantorPhone',
  'guarantorRelationship',
] as const;

function parseIdType(value: string | undefined): BorrowerIdType {
  const normalized = (value || BORROWER_ID_TYPE.GHANA_CARD).toUpperCase();
  if (Object.values(BORROWER_ID_TYPE).includes(normalized as BorrowerIdType)) {
    return normalized as BorrowerIdType;
  }
  return BORROWER_ID_TYPE.GHANA_CARD;
}

function parseGender(value: string | undefined): BorrowerGender {
  const normalized = (value || BORROWER_GENDER.FEMALE).toUpperCase();
  if (Object.values(BORROWER_GENDER).includes(normalized as BorrowerGender)) {
    return normalized as BorrowerGender;
  }
  return BORROWER_GENDER.FEMALE;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return [];
  }
  const headers = lines[0]!.split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? '';
    });
    return row;
  });
}

export default function ImportBorrowersPage() {
  const { user } = useAuth();
  const canRegister = usePermission(PERMISSION.REGISTER_BORROWERS);
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ ok: number; failed: number } | null>(null);

  const templateHref = useMemo(() => {
    const csv = `${TEMPLATE_HEADERS.join(',')}\n`;
    return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  }, []);

  if (!canRegister) {
    return (
      <PageShell variant="executive">
        <Alert title="Permission required" variant="warning">
          You need borrower registration permission to import borrowers.
        </Alert>
      </PageShell>
    );
  }

  async function handleImport() {
    if (!rows.length || !user?.id) {
      return;
    }
    setIsImporting(true);
    setResult(null);
    let ok = 0;
    let failed = 0;
    for (const row of rows) {
      try {
        await borrowerService.registerBorrower({
          fullName: row.fullName,
          phone: row.phone,
          idType: parseIdType(row.idType),
          idNumber: row.idNumber,
          dateOfBirth: row.dateOfBirth,
          gender: parseGender(row.gender),
          nationality: 'Ghanaian',
          houseAddress: row.houseAddress,
          gpsAddress: '',
          city: row.community,
          region: row.region,
          district: row.district,
          businessName: row.businessName,
          businessAddress: row.houseAddress,
          typeOfWork: row.typeOfWork || 'Trading',
          guarantorName: row.guarantorName,
          guarantorPhone: row.guarantorPhone,
          guarantorRelationship: row.guarantorRelationship || 'Relative',
          photoFileName: 'import.jpg',
          photoMimeType: 'image/jpeg',
          registeredByOfficerId: user.id,
        });
        ok += 1;
      } catch {
        failed += 1;
      }
    }
    setResult({ ok, failed });
    setIsImporting(false);
    await queryClient.invalidateQueries({ queryKey: borrowersQueryKey });
    if (ok > 0) {
      notifyMutationSuccess('Import complete', `Imported ${ok} borrower${ok === 1 ? '' : 's'}.`);
    }
    if (failed > 0) {
      notifyMutationError(
        'Import incomplete',
        new Error(`${failed} row(s) failed validation or registration.`),
        `${failed} row(s) failed validation or registration.`,
      );
    }
  }

  return (
    <PageShell variant="executive">
      <div className="mb-wilms-4 space-y-wilms-1">
        <h1 className="text-heading-1 font-semibold text-text-primary">Import borrowers</h1>
        <p className="text-body text-text-muted">
          Upload a CSV using the WILMS borrower template. Each row creates a pending registration.
        </p>
      </div>

      <div className="space-y-wilms-4 rounded-sm border border-border bg-card p-wilms-5">
        <div className="flex flex-wrap gap-wilms-3">
          <a
            href={templateHref}
            download="WILMS_Borrower_Import_Template.csv"
            className="inline-flex h-8 items-center justify-center rounded-sm border border-border px-wilms-3 text-small font-semibold text-text-primary hover:bg-background"
          >
            Download CSV template
          </a>
          <Link href="/borrowers/new">
            <Button variant="ghost" size="sm">
              Register one borrower instead
            </Button>
          </Link>
        </div>

        <label className="block text-small font-semibold text-text-primary">
          CSV file
          <input
            type="file"
            accept=".csv,text/csv"
            className="mt-wilms-2 block w-full text-small"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) {
                setRows([]);
                return;
              }
              const text = await file.text();
              setRows(parseCsv(text));
              setResult(null);
            }}
          />
        </label>

        <p className="text-small text-text-muted">
          {rows.length === 0
            ? 'No rows loaded yet.'
            : `${rows.length} row${rows.length === 1 ? '' : 's'} ready to import.`}
        </p>

        {result ? (
          <Alert title="Import complete" variant={result.failed > 0 ? 'warning' : 'success'}>
            {result.ok} succeeded, {result.failed} failed.
          </Alert>
        ) : null}

        <div className="flex flex-wrap gap-wilms-3">
          <Button
            variant="primary"
            size="sm"
            disabled={!rows.length || isImporting}
            onClick={() => void handleImport()}
          >
            {isImporting ? 'Importing…' : 'Import borrowers'}
          </Button>
          <Link href="/borrowers">
            <Button variant="ghost" size="sm">
              Back to borrowers
            </Button>
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
