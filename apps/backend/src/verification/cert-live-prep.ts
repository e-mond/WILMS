/**
 * P14.5A — RC-052 / RC-059: deterministic live-cert borrower (no open loans).
 *
 * Usage: imported by verify:live and cert:demo prep; npm run cert:live:prep -w @wilms/api
 */
import '../config/load-env.js';
import { eq } from 'drizzle-orm';
import { BORROWER_STATUS } from '@wilms/shared-contracts';
import { getDb, isDatabaseEnabled } from '../db/client.js';
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

  return CERT_LIVE_BORROWER_ID;
}

async function main(): Promise<void> {
  const id = await ensureCertLiveBorrower();
  console.log(`cert:live:prep PASS — borrower ${id} ready`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
