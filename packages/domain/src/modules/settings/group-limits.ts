import { getSettings } from './service.js';

export interface GroupSizeLimits {
  minGroupSize: number;
  maxGroupSize: number;
}

export async function getGroupSizeLimits(): Promise<GroupSizeLimits> {
  const settings = await getSettings();
  const minGroupSize = Number.isFinite(settings.minGroupSize) ? settings.minGroupSize : 5;
  const maxGroupSize = Number.isFinite(settings.maxGroupSize) ? settings.maxGroupSize : 10;
  return { minGroupSize, maxGroupSize };
}

export function formatGroupAtCapacityMessage(input: {
  groupName: string;
  maxGroupSize: number;
}): string {
  return `${input.groupName} has reached the configured maximum size of ${input.maxGroupSize} members. Create a new group or choose another group.`;
}
