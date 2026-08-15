import { listAuditEntries } from '../../infrastructure/audit/audit-log.js';
import { listMessageDeliveries } from '../../infrastructure/notifications/delivery-log.js';
import { listBorrowers } from '../../db/persistence.js';
import * as borrowerService from '../borrowers/service.js';

export interface RecordSearchHit {
  kind: 'borrower' | 'guarantor' | 'group_leader';
  id: string;
  label: string;
  subtitle: string;
  href: string;
}

function matches(value: string | undefined, query: string): boolean {
  if (!value) return false;
  const normalisedValue = value.toLowerCase();
  const normalisedQuery = query.toLowerCase();
  if (normalisedValue.includes(normalisedQuery)) return true;
  const digits = query.replace(/\D/g, '');
  if (digits.length >= 3 && value.replace(/\D/g, '').includes(digits)) return true;
  return false;
}

export async function searchRecords(query: string, role: string): Promise<RecordSearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const borrowers = await listBorrowers();
  const hits: RecordSearchHit[] = [];
  const hrefFor = (id: string) => {
    if (role === 'APPROVER') return `/approver/records/${id}`;
    if (role === 'REGISTRATION_OFFICER') return `/officer/records/${id}`;
    if (role === 'AUDITOR') return `/auditor/records/${id}`;
    return `/records/${id}`;
  };

  for (const borrower of borrowers) {
    const profile = borrower.profile;
    if (
      matches(borrower.fullName, q) ||
      matches(borrower.id, q) ||
      matches(borrower.phone, q) ||
      matches(borrower.idNumber, q) ||
      matches(borrower.groupName, q) ||
      matches(borrower.community, q) ||
      matches(profile.guarantorName, q) ||
      matches(profile.guarantorPhone, q)
    ) {
      hits.push({
        kind: 'borrower',
        id: borrower.id,
        label: borrower.fullName,
        subtitle: `${borrower.phone} · ${borrower.community}`,
        href: hrefFor(borrower.id),
      });
    }
    if (matches(profile.guarantorName, q) || matches(profile.guarantorPhone, q)) {
      hits.push({
        kind: 'guarantor',
        id: `guarantor:${profile.guarantorPhone || profile.guarantorName}`,
        label: profile.guarantorName || 'Guarantor',
        subtitle: profile.guarantorPhone || 'No phone',
        href: `${hrefFor(borrower.id)}?view=guarantor`,
      });
    }
  }

  const seen = new Set<string>();
  return hits.filter((hit) => {
    const key = `${hit.kind}:${hit.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 40);
}

export async function getBorrowerRecordFile(id: string) {
  const profile = await borrowerService.getBorrowerFullProfile(id);
  const audit = (await listAuditEntries({ limit: 200 })).filter((entry) => entry.targetEntityId === id);
  const deliveries = await listMessageDeliveries({ limit: 200 });
  const notifications = deliveries.filter(
    (entry) => entry.borrowerId === id || entry.recipient === profile.phone,
  );
  return {
    profile,
    audit,
    notifications,
  };
}
