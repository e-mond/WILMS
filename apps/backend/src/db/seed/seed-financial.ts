import { eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { BORROWER_STATUS } from '@wilms/shared-contracts';
import { calculateWeeklyPaymentPesewas } from '../../domain/loan/calculations.js';
import { LOAN_LIFECYCLE } from '../../domain/loan/lifecycle.js';
import { generateLoanScheduleWeeks } from '../../domain/loan/schedule.js';
import { pesewasToDecimal } from '../../domain/money.js';
import { getDb } from '../client.js';
import { borrowers } from '../schema/borrowers.js';
import { loanDisbursements } from '../schema/loan-disbursements.js';
import { loanSchedules } from '../schema/loan-schedules.js';
import { ledgerEntries } from '../schema/ledger-entries.js';
import { loans } from '../schema/loans.js';
import { payments } from '../schema/payments.js';
import { users } from '../schema/users.js';

const SEED_BORROWERS = [
  {
    id: '01930001-0001-7000-8000-000000000001',
    fullName: 'Akosua Mensah',
    phone: '+233244111001',
    idNumber: 'GHA-111111111',
    community: 'Accra',
    groupName: 'Sunrise Group',
    hasActiveLoan: true,
  },
  {
    id: '01930001-0001-7000-8000-000000000002',
    fullName: 'Kwame Osei',
    phone: '+233244111002',
    idNumber: 'GHA-222222222',
    community: 'Kumasi',
    groupName: 'Unity Group',
    hasActiveLoan: true,
  },
  {
    id: '01930001-0001-7000-8000-000000000003',
    fullName: 'Efua Boateng',
    phone: '+233244111003',
    idNumber: 'GHA-333333333',
    community: 'Tema',
    groupName: 'Harbour Group',
    hasActiveLoan: false,
  },
  {
    id: '01930001-0001-7000-8000-000000000004',
    fullName: 'Yaw Adom',
    phone: '+233244111004',
    idNumber: 'GHA-444444444',
    community: 'Cape Coast',
    groupName: 'Coastal Group',
    hasActiveLoan: true,
  },
] as const;

const BASE_PROFILE = {
  dateOfBirth: '1990-01-15',
  gender: 'FEMALE',
  nationality: 'Ghanaian',
  houseAddress: '12 Market Road',
  gpsAddress: 'GA-001-0023',
  city: 'Accra',
  region: 'Greater Accra',
  district: 'Osu',
  businessName: 'Provision Shop',
  businessAddress: 'Market Road',
  typeOfWork: 'Trader',
  guarantorName: 'Ama Serwaa',
  guarantorPhone: '+233244999888',
  guarantorRelationship: 'Sibling',
  photoFileName: 'photo.jpg',
  photoMimeType: 'image/jpeg',
};

interface LoanScenario {
  id: string;
  borrowerId: string;
  amountPesewas: number;
  durationWeeks: number;
  paymentDay: string;
  startDate: string;
  cycleBatch: string;
  lifecycleStatus: (typeof LOAN_LIFECYCLE)[keyof typeof LOAN_LIFECYCLE];
  externalStatus: 'PENDING_DISBURSEMENT' | 'ACTIVE' | 'COMPLETED' | 'DEFAULTED' | 'WRITTEN_OFF';
  loanBalancePesewas: number;
  paidWeeks: number;
  missedWeeks: number;
  disbursed: boolean;
}

const LOAN_SCENARIOS: LoanScenario[] = [
  {
    id: '01930002-0001-7000-8000-000000000001',
    borrowerId: SEED_BORROWERS[0].id,
    amountPesewas: 50000,
    durationWeeks: 10,
    paymentDay: 'Friday',
    startDate: '2026-05-01',
    cycleBatch: 'Cycle 1 — January 2026',
    lifecycleStatus: LOAN_LIFECYCLE.ACTIVE,
    externalStatus: 'ACTIVE',
    loanBalancePesewas: 35000,
    paidWeeks: 3,
    missedWeeks: 0,
    disbursed: true,
  },
  {
    id: '01930002-0001-7000-8000-000000000002',
    borrowerId: SEED_BORROWERS[1].id,
    amountPesewas: 24000,
    durationWeeks: 8,
    paymentDay: 'Thursday',
    startDate: '2025-11-01',
    cycleBatch: 'Cycle 4 — October 2025',
    lifecycleStatus: LOAN_LIFECYCLE.COMPLETED,
    externalStatus: 'COMPLETED',
    loanBalancePesewas: 0,
    paidWeeks: 8,
    missedWeeks: 0,
    disbursed: true,
  },
  {
    id: '01930002-0001-7000-8000-000000000003',
    borrowerId: SEED_BORROWERS[2].id,
    amountPesewas: 30000,
    durationWeeks: 12,
    paymentDay: 'Monday',
    startDate: '2026-06-10',
    cycleBatch: 'Cycle 2 — April 2026',
    lifecycleStatus: LOAN_LIFECYCLE.PENDING_DISBURSEMENT,
    externalStatus: 'PENDING_DISBURSEMENT',
    loanBalancePesewas: 30000,
    paidWeeks: 0,
    missedWeeks: 0,
    disbursed: false,
  },
  {
    id: '01930002-0001-7000-8000-000000000004',
    borrowerId: SEED_BORROWERS[3].id,
    amountPesewas: 48000,
    durationWeeks: 12,
    paymentDay: 'Tuesday',
    startDate: '2026-04-01',
    cycleBatch: 'Cycle 2 — April 2026',
    lifecycleStatus: LOAN_LIFECYCLE.DEFAULTED,
    externalStatus: 'DEFAULTED',
    loanBalancePesewas: 32000,
    paidWeeks: 4,
    missedWeeks: 2,
    disbursed: true,
  },
];

async function resolveUserId(email: string): Promise<string> {
  const db = getDb();
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!row) {
    throw new Error(`Seed requires demo user ${email}. Run RBAC seed first.`);
  }

  return row.id;
}

export async function seedFinancialCore(): Promise<void> {
  const db = getDb();
  const officerId = await resolveUserId('officer@wilms.demo');
  const approverId = await resolveUserId('approver@wilms.demo');
  const collectorId = await resolveUserId('collector@wilms.demo');

  for (const borrower of SEED_BORROWERS) {
    await db
      .insert(borrowers)
      .values({
        id: borrower.id,
        fullName: borrower.fullName,
        phone: borrower.phone,
        idType: 'GHANA_CARD',
        idNumber: borrower.idNumber,
        status: BORROWER_STATUS.APPROVED,
        hasActiveLoan: borrower.hasActiveLoan,
        groupName: borrower.groupName,
        community: borrower.community,
        registeredAt: new Date('2026-01-10T10:00:00.000Z'),
        registeredByUserId: officerId,
        profile: BASE_PROFILE,
      })
      .onConflictDoNothing();
  }

  for (const scenario of LOAN_SCENARIOS) {
    const [existing] = await db
      .select({ id: loans.id })
      .from(loans)
      .where(eq(loans.id, scenario.id))
      .limit(1);

    if (existing) {
      continue;
    }

    const weeklyPaymentPesewas = calculateWeeklyPaymentPesewas(
      scenario.amountPesewas,
      scenario.durationWeeks,
    );
    const scheduleWeeks = generateLoanScheduleWeeks({
      durationWeeks: scenario.durationWeeks,
      weeklyPaymentPesewas,
      startDate: scenario.startDate,
      paymentDay: scenario.paymentDay,
    });

    await db.insert(loans).values({
      id: scenario.id,
      borrowerId: scenario.borrowerId,
      lifecycleStatus: scenario.lifecycleStatus,
      externalStatus: scenario.externalStatus,
      principalAmount: pesewasToDecimal(scenario.amountPesewas),
      approvedAmount: pesewasToDecimal(scenario.amountPesewas),
      disbursedAmount: scenario.disbursed
        ? pesewasToDecimal(scenario.amountPesewas)
        : '0',
      installmentAmount: pesewasToDecimal(weeklyPaymentPesewas),
      loanBalance: pesewasToDecimal(scenario.loanBalancePesewas),
      durationWeeks: scenario.durationWeeks,
      paymentDay: scenario.paymentDay,
      startDate: scenario.startDate,
      cycleBatch: scenario.cycleBatch,
      createdByUserId: approverId,
      approvedByUserId: approverId,
      disbursedByUserId: scenario.disbursed ? approverId : null,
    });

    await db.insert(loanSchedules).values(
      scheduleWeeks.map((week, index) => {
        let status: 'PENDING' | 'PAID' | 'MISSED' = 'PENDING';
        if (index < scenario.paidWeeks) {
          status = 'PAID';
        } else if (index >= scenario.paidWeeks && index < scenario.paidWeeks + scenario.missedWeeks) {
          status = 'MISSED';
        }

        return {
          loanId: scenario.id,
          weekNumber: week.weekNumber,
          dueDate: week.dueDate,
          installmentAmount: pesewasToDecimal(week.amountPesewas),
          status,
          paidAt: status === 'PAID' ? new Date() : null,
        };
      }),
    );

    if (scenario.disbursed) {
      const disbursementId = uuidv7();
      await db.insert(loanDisbursements).values({
        id: disbursementId,
        loanId: scenario.id,
        disbursedAmount: pesewasToDecimal(scenario.amountPesewas),
        disbursedByUserId: approverId,
        disbursedAt: new Date('2026-05-02T09:00:00.000Z'),
      });

      await db.insert(ledgerEntries).values({
        id: uuidv7(),
        entryType: 'LOAN_DISBURSEMENT',
        loanId: scenario.id,
        borrowerId: scenario.borrowerId,
        amount: pesewasToDecimal(scenario.amountPesewas),
        currencyCode: 'GHS',
        description: 'Seed loan disbursement',
        actorUserId: approverId,
        recordedAt: new Date('2026-05-02T09:00:00.000Z'),
      });
    }

    for (let weekIndex = 0; weekIndex < scenario.paidWeeks; weekIndex += 1) {
      const week = scheduleWeeks[weekIndex]!;
      const paymentId = uuidv7();

      await db.insert(payments).values({
        id: paymentId,
        borrowerId: scenario.borrowerId,
        collectorUserId: collectorId,
        loanId: scenario.id,
        scheduleWeekNumber: week.weekNumber,
        amountPesewas: week.amountPesewas,
        paymentDate: week.dueDate,
        recordedAt: new Date(`${week.dueDate}T10:00:00.000Z`),
        status: 'CONFIRMED',
      });

      await db.insert(ledgerEntries).values({
        id: uuidv7(),
        entryType: 'REPAYMENT',
        loanId: scenario.id,
        borrowerId: scenario.borrowerId,
        paymentId,
        amount: pesewasToDecimal(week.amountPesewas),
        currencyCode: 'GHS',
        description: `Seed repayment week ${week.weekNumber}`,
        actorUserId: collectorId,
        metadata: { weekNumber: week.weekNumber },
        recordedAt: new Date(`${week.dueDate}T10:00:00.000Z`),
      });
    }
  }
}
