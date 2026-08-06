import { describe, expect, it } from 'vitest';
import { AUDIENCE_OPTIONS } from '@/features/communication-center/components/AudienceComposer';

describe('AudienceComposer options', () => {
  it('includes borrowers, groups, leaders, and auditors', () => {
    const values = AUDIENCE_OPTIONS.map((option) => option.value);
    expect(values).toContain('ALL_BORROWERS');
    expect(values).toContain('SPECIFIC_BORROWERS');
    expect(values).toContain('SPECIFIC_GROUP');
    expect(values).toContain('SPECIFIC_GROUPS');
    expect(values).toContain('ALL_GROUP_LEADERS');
    expect(values).toContain('ALL_AUDITORS');
    expect(values).toContain('CUSTOM');
  });
});
