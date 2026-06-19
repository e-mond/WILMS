import {
  ADJUSTMENT_STATUS,
  ADJUSTMENT_TYPE,
  type AdjustmentRequest,
} from '@/types/adjustment';

export const MOCK_ADJUSTMENT_REQUESTS: AdjustmentRequest[] = [
  {
    id: 'adj-001',
    type: ADJUSTMENT_TYPE.PAYMENT_CORRECTION,
    borrowerId: 'borrower-001',
    borrowerName: 'Ama Mensah',
    loanId: 'loan-001',
    amountPesewas: 5000,
    reason: 'Duplicate payment recorded on 2026-05-23 — reverse one entry.',
    requestedBy: 'Field Collector',
    requestedAt: '2026-06-05T11:30:00.000Z',
    status: ADJUSTMENT_STATUS.PENDING,
  },
  {
    id: 'adj-002',
    type: ADJUSTMENT_TYPE.DISBURSEMENT_CORRECTION,
    borrowerId: 'borrower-002',
    borrowerName: 'Akua Boateng',
    loanId: 'loan-pending-001',
    amountPesewas: 2500,
    reason: 'Disbursement amount entered incorrectly on approval day.',
    requestedBy: 'Loan Approver',
    requestedAt: '2026-06-04T09:15:00.000Z',
    status: ADJUSTMENT_STATUS.PENDING,
  },
  {
    id: 'adj-003',
    type: ADJUSTMENT_TYPE.WRITE_OFF,
    borrowerId: 'borrower-001',
    borrowerName: 'Ama Mensah',
    loanId: 'loan-001',
    amountPesewas: 12000,
    reason: 'Borrower unreachable after 8 missed weeks; guarantor notified.',
    requestedBy: 'Super Admin',
    requestedAt: '2026-06-01T14:00:00.000Z',
    status: ADJUSTMENT_STATUS.PENDING,
  },
];
