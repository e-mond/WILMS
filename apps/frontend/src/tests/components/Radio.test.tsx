import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Radio } from '@/components/ui/Radio';

describe('Radio', () => {
  it('renders with label', () => {
    render(<Radio name="choice" value="a" label="Option A" />);
    expect(screen.getByLabelText('Option A')).toBeInTheDocument();
  });
});
