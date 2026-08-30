import { getSettings } from './service.js';

export interface GuarantorLimits {
  maxGuarantorGuarantees: number;
  maxLeaderGuarantorGuarantees: number;
}

export async function getGuarantorLimits(): Promise<GuarantorLimits> {
  const settings = await getSettings();
  const maxGuarantorGuarantees = Number.isFinite(settings.maxGuarantorGuarantees)
    ? Math.max(1, settings.maxGuarantorGuarantees)
    : 3;
  return {
    maxGuarantorGuarantees,
    maxLeaderGuarantorGuarantees: maxGuarantorGuarantees + 2,
  };
}
