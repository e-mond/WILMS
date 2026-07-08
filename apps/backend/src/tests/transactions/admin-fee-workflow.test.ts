import { describe, expect, it } from 'vitest';
import {
  getCollectorAdminFeeLoginGate,
  listBorrowersAwaitingAdminFee,
  recordAdminFee,
} from '../../modules/transactions/service.js';

describe('collector administration fee workflow', () => {
  it('never requires admin fee prompt on collector login', async () => {
    const gate = await getCollectorAdminFeeLoginGate('collector-1');
    expect(gate.requiresPrompt).toBe(false);
  });

  it('records admin fee once per borrower and excludes from awaiting list', async () => {
    const awaitingBefore = await listBorrowersAwaitingAdminFee();
    const target = awaitingBefore[0];
    if (!target) {
      return;
    }

    await recordAdminFee({ borrowerId: target.id, collectorId: 'collector-1' });
    const awaitingAfter = await listBorrowersAwaitingAdminFee();
    expect(awaitingAfter.some((entry) => entry.id === target.id)).toBe(false);

    await expect(
      recordAdminFee({ borrowerId: target.id, collectorId: 'collector-1' }),
    ).rejects.toThrow('DUPLICATE');
  });
});
