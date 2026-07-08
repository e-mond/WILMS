import { describe, expect, it } from 'vitest';
import { isDatabaseEnabled } from '../../db/client.js';
import { permanentlyDeleteUser } from '../../modules/users/purge.service.js';
import * as userRepo from '../../repositories/user.repository.js';

describe('permanent user deletion', () => {
  it('hard-deletes invited users without activity', async () => {
    if (!isDatabaseEnabled()) {
      await expect(permanentlyDeleteUser('missing-user', 'system')).resolves.toBeUndefined();
      return;
    }

    const invited = (await userRepo.listUsers()).find((row) => row.status === 'INVITED');
    if (!invited) {
      return;
    }

    await permanentlyDeleteUser(invited.id, 'system');
    const after = await userRepo.getUserById(invited.id);
    expect(after).toBeUndefined();
  });
});
