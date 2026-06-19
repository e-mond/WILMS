import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('renders with accessible label via aria-label', () => {
    render(<Input aria-label="Phone number" type="tel" placeholder="0240000000" />);
    expect(screen.getByRole('textbox', { name: 'Phone number' })).toHaveAttribute('type', 'tel');
  });

  it('exposes error state to assistive technology', () => {
    render(<Input aria-label="Amount" hasError />);
    expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });
});
