import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MultiStepForm } from '@/components/forms/MultiStepForm';

describe('MultiStepForm', () => {
  it('renders the active step and navigation actions', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();

    render(
      <MultiStepForm
        steps={[
          { id: 'personal', title: 'Personal Details' },
          { id: 'review', title: 'Review' },
        ]}
        currentStep={0}
        onNext={onNext}
      >
        <p>Step content</p>
      </MultiStepForm>,
    );

    expect(screen.getByText('Step content')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Registration progress' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('shows submit action on the review step', () => {
    render(
      <MultiStepForm
        steps={[
          { id: 'personal', title: 'Personal Details' },
          { id: 'review', title: 'Review' },
        ]}
        currentStep={1}
        onSubmit={vi.fn()}
      >
        <p>Review content</p>
      </MultiStepForm>,
    );

    expect(screen.getByRole('button', { name: 'Submit registration' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
  });

  it('hides future step titles when hideFutureSteps is enabled', () => {
    render(
      <MultiStepForm
        steps={[
          { id: 'personal', title: 'Personal Details' },
          { id: 'address', title: 'Address' },
          { id: 'review', title: 'Review' },
        ]}
        currentStep={1}
        hideFutureSteps
      >
        <p>Address content</p>
      </MultiStepForm>,
    );

    expect(screen.getByText('Personal Details')).toBeInTheDocument();
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.queryByText('Review')).not.toBeInTheDocument();
  });
});
