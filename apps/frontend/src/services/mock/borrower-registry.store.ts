import { MOCK_BORROWER_REGISTRY, type BorrowerRegistryEntry } from '@/mocks/borrower-registry';
import { profileFromRegistrationPayload } from '@/utils/borrower-profile';
import { BORROWER_STATUS, type BorrowerStatus } from '@/types/borrower';
import type { RegisterBorrowerPayload } from '@/types/borrower-registration';

let registryEntries: BorrowerRegistryEntry[] = [...MOCK_BORROWER_REGISTRY];

export function getBorrowerRegistryEntries(): BorrowerRegistryEntry[] {
  return registryEntries;
}

export function getBorrowerRegistryEntry(id: string): BorrowerRegistryEntry | undefined {
  return registryEntries.find((entry) => entry.id === id);
}

export function addBorrowerRegistryEntry(payload: RegisterBorrowerPayload): BorrowerRegistryEntry {
  const entry: BorrowerRegistryEntry = {
    id: crypto.randomUUID(),
    fullName: payload.fullName,
    phone: payload.phone,
    idType: payload.idType,
    idNumber: payload.idNumber,
    status: BORROWER_STATUS.PENDING,
    hasActiveLoan: false,
    groupName: 'Unassigned',
    community: payload.city,
    registeredAt: new Date().toISOString(),
    registeredByOfficerId: payload.registeredByOfficerId,
    profile: profileFromRegistrationPayload(payload),
  };

  registryEntries = [...registryEntries, entry];
  return entry;
}

export function updateBorrowerRegistryStatus(
  id: string,
  status: BorrowerStatus,
): BorrowerRegistryEntry {
  const existing = registryEntries.find((entry) => entry.id === id);

  if (!existing) {
    throw new Error('Borrower registry entry not found.');
  }

  const updated: BorrowerRegistryEntry = {
    ...existing,
    status,
    groupName: status === BORROWER_STATUS.APPROVED ? 'Unassigned' : existing.groupName,
  };

  registryEntries = registryEntries.map((entry) => (entry.id === id ? updated : entry));
  return updated;
}

export function removeBorrowerRegistryEntry(id: string): void {
  registryEntries = registryEntries.filter((entry) => entry.id !== id);
}

export function resetBorrowerRegistry(): void {
  registryEntries = [...MOCK_BORROWER_REGISTRY];
}
