import type { GroupDetail } from '@/types/group-detail';
import {
  buildGroupProfileExportDocument,
  downloadWilmsCsv,
  downloadWilmsExcel,
  downloadWilmsPdf,
  printWilmsDocument,
} from '@/features/export';

export function buildGroupProfileExportDocumentForGroup(
  group: GroupDetail,
  generatedBy: string,
) {
  return buildGroupProfileExportDocument(group, generatedBy);
}

export function downloadGroupProfileCsv(group: GroupDetail, generatedBy: string): void {
  const document = buildGroupProfileExportDocument(group, generatedBy);
  downloadWilmsCsv(document, `${group.id}-profile.csv`);
}

export function downloadGroupProfileExcel(group: GroupDetail, generatedBy: string): void {
  const document = buildGroupProfileExportDocument(group, generatedBy);
  void downloadWilmsExcel(document, `${group.id}-profile.xlsx`);
}

export function downloadGroupProfilePdf(group: GroupDetail, generatedBy: string): void {
  const document = buildGroupProfileExportDocument(group, generatedBy);
  downloadWilmsPdf(document, `${group.id}-profile.pdf`);
}

export function printGroupProfile(group: GroupDetail, generatedBy: string): void {
  const document = buildGroupProfileExportDocument(group, generatedBy);
  printWilmsDocument(document);
}

/** @deprecated Use buildGroupProfileExportDocument from @/features/export */
export { buildGroupProfileExportDocument } from '@/features/export/builders/group-profile-document';
