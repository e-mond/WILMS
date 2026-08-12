import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationAutocomplete } from '@/features/locations/components/LocationAutocomplete';

vi.mock('@/services/locationService', () => ({
  default: {
    autocomplete: vi.fn(async () => ({
      meta: { version: 'test', source: 'mock', lastUpdated: null },
      data: [
        {
          type: 'community',
          id: 'c1',
          name: 'Nkontompo',
          districtId: 'd1',
          score: 0.99,
        },
      ],
    })),
  },
}));

describe('LocationAutocomplete', () => {
  it('supports keyboard navigation and selects a community hit', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onSelect = vi.fn();

    render(
      <LocationAutocomplete
        label="Community"
        value="Nk"
        onChange={onChange}
        onSelect={onSelect}
        entityTypes={['community']}
        districtId="d1"
        localOptions={[{ id: 'c1', name: 'Nkontompo', districtId: 'd1' }]}
      />,
    );

    const input = screen.getByRole('combobox');
    await waitFor(() => {
      expect(screen.getByRole('option')).toBeInTheDocument();
    });

    await user.type(input, '{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenCalledWith('Nkontompo');
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c1', name: 'Nkontompo', type: 'community' }),
    );
  });
});
