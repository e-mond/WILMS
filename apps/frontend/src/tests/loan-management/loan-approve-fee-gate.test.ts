import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

function read(relative: string): string {
  return readFileSync(join(frontendRoot, relative), 'utf8');
}

describe('loan approve UI workflow', () => {
  it('does not block approve on admin fee; disburse still gates on fee', () => {
    const panel = read('src/features/loan-management/components/LoanDetailPanel.tsx');
    const approveBlock = panel.slice(
      panel.indexOf("showApprove ?"),
      panel.indexOf('showDisburse ?'),
    );

    expect(approveBlock).not.toMatch(/disabled=\{approveLoan\.isPending \|\| !feeSatisfied\}/);
    expect(approveBlock).toContain('disabled={approveLoan.isPending}');
    expect(panel).toContain('disburseEnabled = showDisburse && feeSatisfied');
  });
});
