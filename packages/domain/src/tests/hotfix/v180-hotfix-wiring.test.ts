import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');

function read(relative: string): string {
  return readFileSync(join(root, relative), 'utf8');
}

describe('v1.8.0 hotfix wiring', () => {
  it('enforces stored group size settings instead of env defaults', () => {
    const groups = read('src/modules/groups/service.ts');
    const formation = read('src/modules/group-formation/service.ts');
    expect(groups).toContain('getGroupSizeLimits');
    expect(groups).not.toContain('env.maxGroupSize');
    expect(formation).toContain('getGroupSizeLimits');
    expect(formation).not.toContain('env.minGroupSize');
  });

  it('does not SMS borrowers on group assignment before approval', () => {
    const groups = read('src/modules/groups/service.ts');
    expect(groups).toContain('notifyBorrower:');
    expect(groups).toContain('BORROWER_STATUS.APPROVED');
  });

  it('creates registration escalate SMS and records search', () => {
    const borrowers = read('src/modules/borrowers/service.ts');
    const dispatch = read('src/infrastructure/notifications/event-dispatch.ts');
    const records = read('src/modules/records/service.ts');
    expect(borrowers).toContain('escalateBorrower');
    expect(dispatch).toContain('notifyRegistrationEscalated');
    expect(dispatch).toContain('notifyGuarantorLoanApproved');
    expect(records).toContain('searchRecords');
  });
});
