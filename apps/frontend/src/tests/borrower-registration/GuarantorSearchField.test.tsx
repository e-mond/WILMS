import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GuarantorSearchField } from '@/features/borrower-registration/components/GuarantorSearchField';
import { borrowerService } from '@/services';
import type { GuarantorLookupResult, GuarantorSearchHit } from '@/types/guarantor-search';

vi.mock('@/services', () => ({
  borrowerService: {
    searchGuarantors: vi.fn(),
    lookupGuarantor: vi.fn(),
  },
}));

const hit: GuarantorSearchHit = {
  kind: 'borrower',
  key: 'borrower:1',
  name: 'Gloria Serwaa',
  phone: '0551112233',
  phoneDisplay: '055 XXX 2233',
  displayId: 'BRW-2026-00417',
  community: 'Fijai',
  groupName: 'Airport Ridge Group 001',
  activeGuaranteeCount: 1,
  maxGuarantees: 3,
  isEligiblePreview: true,
};

const lookup: GuarantorLookupResult = {
  name: 'Gloria Serwaa',
  phone: '0551112233',
  phoneDisplay: '055 XXX 2233',
  displayId: 'BRW-2026-00417',
  community: 'Fijai',
  idType: 'VOTER_ID',
  idNumber: 'A01010',
  isGroupLeader: false,
  isBlacklisted: false,
  eligibility: {
    isEligible: true,
    activeGuaranteeCount: 1,
    maxGuarantees: 3,
    isDuplicateRegistration: false,
    validationStatus: 'VALID',
    message: 'Current Guarantees: 1 of 3',
    eligibilityScore: 80,
    riskRating: 'LOW',
    scoreFactors: [],
  },
  guaranteedBorrowers: [
    {
      displayId: 'BRW-2026-00100',
      fullName: 'Ama Mensah',
      community: 'Fijai',
      status: 'APPROVED',
    },
  ],
};

function ControlledSearch(props: {
  onSelected?: (value: GuarantorLookupResult | null) => void;
  onManualEntry?: () => void;
}) {
  const [value, setValue] = useState('');
  const [selected, setSelected] = useState<GuarantorLookupResult | null>(null);
  const [manual, setManual] = useState(false);

  return (
    <GuarantorSearchField
      id="guarantorName"
      value={value}
      onChange={setValue}
      selected={selected}
      isManualEntry={manual}
      onSelected={(next) => {
        setSelected(next);
        props.onSelected?.(next);
      }}
      onManualEntry={() => {
        setManual(true);
        props.onManualEntry?.();
      }}
    />
  );
}

describe('GuarantorSearchField', () => {
  beforeEach(() => {
    vi.mocked(borrowerService.searchGuarantors).mockReset();
    vi.mocked(borrowerService.lookupGuarantor).mockReset();
  });

  it('debounces search and shows results', async () => {
    const user = userEvent.setup();
    vi.mocked(borrowerService.searchGuarantors).mockResolvedValue([hit]);

    render(<ControlledSearch />);

    await user.type(screen.getByRole('combobox'), 'Gloria');

    await waitFor(
      () => {
        expect(borrowerService.searchGuarantors).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );

    expect(vi.mocked(borrowerService.searchGuarantors).mock.calls.at(-1)?.[0]).toBe('Gloria');
    expect(await screen.findByText('Gloria Serwaa')).toBeInTheDocument();
    expect(screen.getByText('BRW-2026-00417')).toBeInTheDocument();
    expect(screen.getByText('+ Enter guarantor manually')).toBeInTheDocument();
  });

  it('selects a result and auto-populates via lookup', async () => {
    const user = userEvent.setup();
    vi.mocked(borrowerService.searchGuarantors).mockResolvedValue([hit]);
    vi.mocked(borrowerService.lookupGuarantor).mockResolvedValue(lookup);
    const onSelected = vi.fn();

    render(<ControlledSearch onSelected={onSelected} />);

    await user.type(screen.getByRole('combobox'), 'Gloria');
    await user.click(await screen.findByRole('option', { name: /Gloria Serwaa/i }));

    await waitFor(() => {
      expect(borrowerService.lookupGuarantor).toHaveBeenCalledWith('0551112233', expect.any(Object));
      expect(onSelected).toHaveBeenCalledWith(lookup);
    });

    expect(screen.getByText(/Existing guarantor found/i)).toBeInTheDocument();
  });

  it('supports manual entry when no match is found', async () => {
    const user = userEvent.setup();
    vi.mocked(borrowerService.searchGuarantors).mockResolvedValue([]);
    const onManualEntry = vi.fn();

    render(<ControlledSearch onManualEntry={onManualEntry} />);

    await user.type(screen.getByRole('combobox'), 'Unknown Person');
    expect(await screen.findByText('No matching guarantor found')).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: /enter guarantor manually/i }));
    expect(onManualEntry).toHaveBeenCalled();
  });

  it('shows selected existing guarantor summary and clear action', async () => {
    const user = userEvent.setup();
    const onSelected = vi.fn();

    render(
      <GuarantorSearchField
        id="guarantorName"
        value="Gloria Serwaa"
        onChange={vi.fn()}
        selected={lookup}
        onSelected={onSelected}
        onManualEntry={vi.fn()}
        isManualEntry={false}
      />,
    );

    expect(screen.getByText(/Existing guarantor found/i)).toBeInTheDocument();
    expect(screen.getByText('BRW-2026-00417')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(onSelected).toHaveBeenCalledWith(null);
  });
});
