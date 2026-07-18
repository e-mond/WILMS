import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  FloatingActionSlot,
  FloatingActionStack,
} from '@/components/layout/shell/FloatingActionStack';

describe('FloatingActionStack', () => {
  it('renders a shared bottom-right stack container for floating controls', () => {
    render(
      <FloatingActionStack>
        <FloatingActionSlot>
          <button type="button">Help</button>
        </FloatingActionSlot>
        <FloatingActionSlot>
          <span>Online</span>
        </FloatingActionSlot>
      </FloatingActionStack>,
    );

    const stack = document.querySelector('[data-floating-action-stack="true"]');
    expect(stack).toBeTruthy();
    expect(stack?.className).toContain('fixed');
    expect(stack?.className).toContain('flex-col-reverse');
    expect(screen.getByRole('button', { name: 'Help' })).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
  });
});
