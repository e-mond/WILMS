import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { describe, expect, it } from 'vitest';
import { AsideSlotProvider, useAsideSlot } from '@/components/layout/shell/AsideSlotContext';
import { ShellAsideDrawer } from '@/components/layout/shell/ShellAsideDrawer';
import { useUiStore } from '@/state/uiStore';

function AsideContentInjector() {
  const { setContent } = useAsideSlot();

  useEffect(() => {
    setContent(<p>Dashboard alert content</p>);
    return () => setContent(null);
  }, [setContent]);

  return null;
}

describe('ShellAsideDrawer', () => {
  it('opens a context drawer when alerts content is registered', async () => {
    useUiStore.setState({ isAsideDrawerOpen: false });
    const user = userEvent.setup();

    render(
      <AsideSlotProvider>
        <AsideContentInjector />
        <ShellAsideDrawer />
      </AsideSlotProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Open context panel' }));
    expect(screen.getByRole('dialog', { name: 'Context panel' })).toBeInTheDocument();
    expect(screen.getByText('Dashboard alert content')).toBeInTheDocument();
  });
});
