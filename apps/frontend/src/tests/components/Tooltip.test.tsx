import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Tooltip } from '@/components/ui/Tooltip';

describe('Tooltip', () => {
  it('renders trigger content', () => {
    render(
      <Tooltip content="Helpful hint">
        <button type="button">Info</button>
      </Tooltip>,
    );

    expect(screen.getByRole('button', { name: 'Info' })).toBeInTheDocument();
  });
});
