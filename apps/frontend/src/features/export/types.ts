export const WILMS_REPORT_TYPE = {
  GROUP_PROFILE: 'GROUP_PROFILE',
  GROUP_LIST: 'GROUP_LIST',
  BORROWER_LIST: 'BORROWER_LIST',
  BORROWER_PROFILE: 'BORROWER_PROFILE',
  COLLECTOR_LIST: 'COLLECTOR_LIST',
  LOAN_POOL: 'LOAN_POOL',
  LOAN_PORTFOLIO: 'LOAN_PORTFOLIO',
  RISK_FLAGS: 'RISK_FLAGS',
  SETTINGS: 'SETTINGS',
  AUDIT_LOG: 'AUDIT_LOG',
  GROUP_RISK: 'GROUP_RISK',
  DEFAULTER: 'DEFAULTER',
  DAILY_COLLECTION: 'DAILY_COLLECTION',
  COLLECTOR_PERFORMANCE: 'COLLECTOR_PERFORMANCE',
  FINANCIAL_LEDGER: 'FINANCIAL_LEDGER',
  GENERIC_REPORT: 'GENERIC_REPORT',
} as const;

export type WilmsReportType = (typeof WILMS_REPORT_TYPE)[keyof typeof WILMS_REPORT_TYPE];

export type WilmsEnvironment = 'Development' | 'Staging' | 'Production';

export type WilmsExportOrientation = 'portrait' | 'landscape';

export interface WilmsExportMetadata {
  reportType: WilmsReportType;
  reportTitle: string;
  reportId: string;
  generatedAt: string;
  generatedBy: string;
  environment: WilmsEnvironment;
  referencePrefix: string;
  entityRef?: string;
}

export interface WilmsExportMetric {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}

export interface WilmsExportTable {
  headers: string[];
  rows: string[][];
  totalsRow?: string[];
  caption?: string;
}

export interface WilmsExportSection {
  title: string;
  type: 'summary' | 'metrics' | 'table' | 'text' | 'signature';
  summaryItems?: { label: string; value: string }[];
  metrics?: WilmsExportMetric[];
  table?: WilmsExportTable;
  content?: string;
}

export interface WilmsExportSignature {
  label: string;
  name?: string;
}

import type { RegistrationAgreementContent } from '@/utils/registration-agreement-fields';

export interface WilmsExportDocument {
  metadata: WilmsExportMetadata;
  executiveSummary?: string;
  sections: WilmsExportSection[];
  signatures?: WilmsExportSignature[];
  orientation?: WilmsExportOrientation;
  /** When set, print/PDF use the registration agreement layout instead of generic report HTML. */
  registrationAgreement?: RegistrationAgreementContent;
}

export interface WilmsExportDownloadOptions {
  filename: string;
}

export interface TabularExportInput {
  reportType: WilmsReportType;
  reportTitle: string;
  generatedBy: string;
  headers: string[];
  rows: string[][];
  executiveSummary?: string;
  entityRef?: string;
  metrics?: WilmsExportMetric[];
  reportId?: string;
}
