export const WILMS_ORG_NAME = 'WILMS';
export const WILMS_ORG_FULL_NAME = "Women's Interest-Free Loan Management System";
export const WILMS_ORG_IDENTIFIER = 'WILMS-GH-001';

export const WILMS_EXPORT_COLORS = {
  primary: '#0F6E56',
  accent: '#BA7517',
  danger: '#993C1D',
  success: '#3B6D11',
  text: '#1A1A1A',
  muted: '#5C5C5C',
  border: '#D9D9D9',
  rowAlt: '#F5F7F6',
  headerBg: '#0F6E56',
  headerText: '#FFFFFF',
} as const;

export const WILMS_EXPORT_FONTS = {
  sans: '"DM Sans", system-ui, sans-serif',
  serif: '"DM Serif Display", Georgia, serif',
} as const;

export const WILMS_CONFIDENTIALITY_NOTICE =
  'CONFIDENTIAL — For authorized WILMS personnel, executive review, and official record keeping only.';

export const WILMS_WORKBOOK_TITLE = 'WILMS Report';

export const WILMS_REPORT_TYPE_PREFIX: Record<string, string> = {
  GROUP_PROFILE: 'GRP',
  GROUP_LIST: 'GRP',
  BORROWER_LIST: 'BOR',
  BORROWER_PROFILE: 'BOR',
  COLLECTOR_LIST: 'COL',
  LOAN_POOL: 'POL',
  LOAN_PORTFOLIO: 'LON',
  RISK_FLAGS: 'RSK',
  SETTINGS: 'SET',
  AUDIT_LOG: 'AUD',
  GROUP_RISK: 'RSK',
  DEFAULTER: 'DEF',
  DAILY_COLLECTION: 'COL',
  COLLECTOR_PERFORMANCE: 'CPR',
  FINANCIAL_LEDGER: 'FIN',
  GENERIC_REPORT: 'RPT',
};
