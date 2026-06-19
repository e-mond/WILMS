import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CurrencyAmount } from '@/components/data-display/CurrencyAmount';

describe('CurrencyAmount', () => {
  it('formats pesewas as Ghana Cedis', () => {
    render(<CurrencyAmount value={5000} />);

    expect(screen.getByText('GH₵50.00')).toBeInTheDocument();
  });
});
