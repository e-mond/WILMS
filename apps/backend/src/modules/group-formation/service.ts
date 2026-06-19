import { env } from '../../config/env.js';
import {
  assignBorrowerToGroup,
  getApprovedQueue,
  nextGroupSequence,
  saveGroup,
  setApprovedQueue,
} from '../../db/persistence.js';
import { groupRepository } from '../../repositories/index.js';
import { isDatabaseEnabled } from '../../db/client.js';
import { randomUUID } from 'node:crypto';

export function getFormationConfig() {
  return {
    minGroupSize: env.minGroupSize,
    maxGroupSize: env.maxGroupSize,
  };
}

export async function getCommunityFormationStatus(community: string) {
  const config = getFormationConfig();
  const approvedCount = (await getApprovedQueue(community)).length;

  return {
    community,
    approvedCount,
    minGroupSize: config.minGroupSize,
    maxGroupSize: config.maxGroupSize,
    readyForFormation: approvedCount >= config.minGroupSize,
  };
}

function normalizeCommunity(community: string): string {
  return community.trim().toLowerCase();
}

async function buildGroupSystemId(community: string, approvedAt: string): Promise<string> {
  const date = new Date(approvedAt);
  const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const sequence = await nextGroupSequence(`${normalizeCommunity(community)}:${monthKey}`);
  const communityCode = community.slice(0, 3).toUpperCase();
  return `GRP-${communityCode}-${monthKey.replace('-', '')}-${String(sequence).padStart(3, '0')}`;
}

export async function processApprovedBorrower(input: {
  borrowerId: string;
  fullName: string;
  community: string;
  approvedAt: string;
}) {
  const queue = [...(await getApprovedQueue(input.community))];
  queue.push({
    borrowerId: input.borrowerId,
    fullName: input.fullName,
    community: input.community,
    approvedAt: input.approvedAt,
  });

  if (queue.length < env.minGroupSize) {
    await setApprovedQueue(input.community, queue);
    return {
      created: false,
      message: `${queue.length} of ${env.minGroupSize} approved members in ${input.community}.`,
    };
  }

  const batch = queue.splice(0, env.maxGroupSize);
  await setApprovedQueue(input.community, queue);

  const groupId = isDatabaseEnabled() ? groupRepository.nextGroupId() : `group-${randomUUID().slice(0, 8)}`;
  const systemId = await buildGroupSystemId(input.community, input.approvedAt);
  const displayName = `${input.community} Group ${systemId.split('-').pop()}`;

  const group = await saveGroup({
    id: groupId,
    systemId,
    name: displayName,
    displayName,
    community: input.community,
    memberIds: batch.map((member) => member.borrowerId),
    formedAt: input.approvedAt,
  });

  for (const member of batch) {
    await assignBorrowerToGroup(member.borrowerId, group);
  }

  return {
    created: true,
    groupId: group.id,
    groupSystemId: group.systemId,
    displayName: group.displayName,
    memberCount: batch.length,
    message: `Group ${group.displayName} created with ${batch.length} members.`,
  };
}
