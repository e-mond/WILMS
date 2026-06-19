import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Switch } from '@/components/ui/Switch';

describe('Switch', () => {
  it('renders with label', () => {
    render(<Switch label="Enable alerts" checked={false} onChange={() => undefined} />);
    expect(screen.getByLabelText('Enable alerts')).toBeInTheDocument();
  });
});
