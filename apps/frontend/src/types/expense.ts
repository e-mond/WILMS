export const EXPENSE_CATEGORY = {
  FUEL: 'FUEL',
  TRANSPORT: 'TRANSPORT',
  AIRTIME: 'AIRTIME',
  FIELD_OPERATIONS: 'FIELD_OPERATIONS',
  OFFICE: 'OFFICE',
  COMMUNITY_MEETINGS: 'COMMUNITY_MEETINGS',
  OTHER: 'OTHER',
} as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORY)[keyof typeof EXPENSE_CATEGORY];

export const EXPENSE_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type ExpenseStatus = (typeof EXPENSE_STATUS)[keyof typeof EXPENSE_STATUS];

export interface ExpenseRecord {
  id: string;
  displayId?: string;
  category: ExpenseCategory;
  categoryLabel: string;
  amountPesewas: number;
  expenseDate: string;
  reason: string;
  notes?: string;
  receiptFileName?: string;
  receiptUploadId?: string;
  gpsLabel?: string;
  recordedById: string;
  recordedByName: string;
  status: ExpenseStatus;
  createdAt: string;
}

export interface CreateExpenseInput {
  category: ExpenseCategory;
  amountPesewas: number;
  expenseDate: string;
  reason: string;
  notes?: string;
  receiptFileName?: string;
  receiptUploadId?: string;
  gpsLabel?: string;
  recordedById: string;
  recordedByName: string;
}

export interface ExpenseListResponse {
  expenses: ExpenseRecord[];
  summary: {
    pendingCount: number;
    approvedTotalPesewas: number;
    pendingTotalPesewas: number;
  };
}

export interface ReviewExpenseInput {
  status: typeof EXPENSE_STATUS.APPROVED | typeof EXPENSE_STATUS.REJECTED;
  reviewNote?: string;
}
