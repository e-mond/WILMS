import { beforeEach, describe, expect, it } from 'vitest';
import {
  dissolveGroup,
  relocateBorrower,
  requestMemberReplacement,
  requestScheduleChange,
} from '../../modules/enterprise/service.js';

describe('enterprise workflows (memory mode)', () => {
  beforeEach(() => {
    // Memory stores are process-global; tests assert validation/error paths that do not need DB.
  });

  it('requires community and reason for relocation', async () => {
    await expect(
      relocateBorrower({
        borrowerId: 'missing',
        community: '',
        reason: '',
        actorUserId: 'actor-1',
      }),
    ).rejects.toThrow(/VALIDATION:/);
  });

  it('requires dissolution reason', async () => {
    await expect(
      dissolveGroup({
        groupId: 'missing',
        reason: '  ',
        actorUserId: 'actor-1',
      }),
    ).rejects.toThrow(/VALIDATION:/);
  });

  it('rejects identical borrowers on replacement request', async () => {
    await expect(
      requestMemberReplacement({
        groupId: 'group-1',
        outgoingBorrowerId: 'b1',
        incomingBorrowerId: 'b1',
        reason: 'Swap',
        actorUserId: 'actor-1',
      }),
    ).rejects.toThrow(/VALIDATION:/);
  });

  it('rejects invalid payment day on schedule change', async () => {
    await expect(
      requestScheduleChange({
        loanId: 'loan-1',
        toPaymentDay: 'NotADay',
        effectiveFrom: '2026-08-10',
        reason: 'Emergency',
        actorUserId: 'actor-1',
      }),
    ).rejects.toThrow(/VALIDATION:/);
  });
});
