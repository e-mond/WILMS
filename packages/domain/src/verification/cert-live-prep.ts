/**
 * P14.5A — RC-052 / RC-059: deterministic live-cert borrower (no open loans).
 *
 * Usage: imported by verify:live and cert:demo prep; npm run cert:live:prep -w @wilms/api
 */
import '../config/load-env.js';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { eq, inArray, like } from 'drizzle-orm';
import { BORROWER_STATUS } from '@wilms/shared-contracts';
import { getDb, isDatabaseEnabled } from '../db/client.js';
import { financialAdjustments, adjustmentHistory } from '../db/schema/financial-adjustments.js';
import { financialReversals, reversalHistory } from '../db/schema/financial-reversals.js';
import { idempotencyKeys } from '../db/schema/idempotency-keys.js';
import { ledgerEntries } from '../db/schema/ledger-entries.js';
import { poolAllocations } from '../db/schema/loan-pools.js';
import { loanDisbursements } from '../db/schema/loan-disbursements.js';
import { loanSchedules } from '../db/schema/loan-schedules.js';
import { loans } from '../db/schema/loans.js';
import { payments } from '../db/schema/payments.js';
import { borrowers } from '../db/schema/borrowers.js';
import { users } from '../db/schema/users.js';

export const CERT_LIVE_BORROWER_ID = '01930001-0001-7000-8000-00000000c001';

const CERT_BORROWER = {
  id: CERT_LIVE_BORROWER_ID,
  fullName: 'Cert Harness Borrower',
  phone: '+233244111099',
  idNumber: 'GHA-CERT-0001',
  community: 'Accra',
  groupName: 'Cert Group',
};

const BASE_PROFILE = {
  dateOfBirth: '1990-06-15',
  gender: 'FEMALE',
  nationality: 'Ghanaian',
  houseAddress: '1 Cert Lane',
  gpsAddress: 'GA-CERT-0001',
  city: 'Accra',
  region: 'Greater Accra',
  district: 'Osu',
  businessName: 'Cert Shop',
  businessAddress: 'Cert Lane',
  typeOfWork: 'Trader',
  guarantorName: 'Cert Guarantor',
  guarantorPhone: '+233244111098',
  guarantorRelationship: 'Sibling',
  photoFileName: 'photo.jpg',
  photoMimeType: 'image/jpeg',
};

async function clearCertLiveHarnessLoans(): Promise<number> {
  const db = getDb();
  const harnessLoans = await db
    .select({ id: loans.id })
    .from(loans)
    .where(eq(loans.borrowerId, CERT_LIVE_BORROWER_ID));

  if (harnessLoans.length === 0) {
    await db.delete(idempotencyKeys).where(like(idempotencyKeys.idempotencyKey, 'p143a4-%'));
    return 0;
  }

  const loanIds = harnessLoans.map((row) => row.id);

  const reversalRows = await db
    .select({ id: financialReversals.id })
    .from(financialReversals)
    .where(inArray(financialReversals.loanId, loanIds));
  if (reversalRows.length > 0) {
    const reversalIds = reversalRows.map((row) => row.id);
    await db.delete(reversalHistory).where(inArray(reversalHistory.reversalId, reversalIds));
    await db.delete(financialReversals).where(inArray(financialReversals.id, reversalIds));
  }

  const adjustmentRows = await db
    .select({ id: financialAdjustments.id })
    .from(financialAdjustments)
    .where(inArray(financialAdjustments.loanId, loanIds));
  if (adjustmentRows.length > 0) {
    const adjustmentIds = adjustmentRows.map((row) => row.id);
    await db.delete(adjustmentHistory).where(inArray(adjustmentHistory.adjustmentId, adjustmentIds));
    await db.delete(financialAdjustments).where(inArray(financialAdjustments.id, adjustmentIds));
  }

  await db.delete(poolAllocations).where(inArray(poolAllocations.loanId, loanIds));

  const paymentRows = await db
    .select({ id: payments.id })
    .from(payments)
    .where(inArray(payments.loanId, loanIds));
  const paymentIds = paymentRows.map((row) => row.id);
  if (paymentIds.length > 0) {
    await db.delete(poolAllocations).where(inArray(poolAllocations.paymentId, paymentIds));
    await db.delete(ledgerEntries).where(inArray(ledgerEntries.paymentId, paymentIds));
  }

  await db.delete(ledgerEntries).where(inArray(ledgerEntries.loanId, loanIds));
  await db.delete(payments).where(inArray(payments.loanId, loanIds));
  await db.delete(loanSchedules).where(inArray(loanSchedules.loanId, loanIds));
  await db.delete(loanDisbursements).where(inArray(loanDisbursements.loanId, loanIds));
  await db.delete(loans).where(inArray(loans.id, loanIds));
  await db.delete(idempotencyKeys).where(like(idempotencyKeys.idempotencyKey, 'p143a4-%'));

  return loanIds.length;
}

export async function ensureCertLiveBorrower(): Promise<string> {
  if (!isDatabaseEnabled()) {
    throw new Error('DATABASE_URL required for cert live prep');
  }

  const db = getDb();
  const [officer] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, 'officer@wilms.demo'))
    .limit(1);

  if (!officer) {
    throw new Error('Demo officer missing — run db:seed');
  }

  const clearedLoans = await clearCertLiveHarnessLoans();

  await db
    .insert(borrowers)
    .values({
      id: CERT_BORROWER.id,
      fullName: CERT_BORROWER.fullName,
      phone: CERT_BORROWER.phone,
      idType: 'GHANA_CARD',
      idNumber: CERT_BORROWER.idNumber,
      status: BORROWER_STATUS.APPROVED,
      hasActiveLoan: false,
      groupName: CERT_BORROWER.groupName,
      community: CERT_BORROWER.community,
      registeredAt: new Date('2026-01-01T10:00:00.000Z'),
      registeredByUserId: officer.id,
      profile: BASE_PROFILE,
    })
    .onConflictDoUpdate({
      target: borrowers.id,
      set: {
        status: BORROWER_STATUS.APPROVED,
        hasActiveLoan: false,
        updatedAt: new Date(),
      },
    });

  if (clearedLoans > 0) {
    console.log(`cert:live:prep cleared ${clearedLoans} harness loan(s) for ${CERT_LIVE_BORROWER_ID}`);
  }

  return CERT_LIVE_BORROWER_ID;
}

async function main(): Promise<void> {
  const id = await ensureCertLiveBorrower();
  console.log(`cert:live:prep PASS — borrower ${id} ready`);
}

const isDirectRun =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
