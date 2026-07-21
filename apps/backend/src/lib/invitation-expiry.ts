/** Invitation validity window after `invitedAt` (or last resend). */
export const INVITATION_EXPIRY_DAYS = 7;

export function computeInvitationExpiresAt(from: Date = new Date()): Date {
  const expires = new Date(from.getTime());
  expires.setUTCDate(expires.getUTCDate() + INVITATION_EXPIRY_DAYS);
  return expires;
}

export function isInvitationExpired(
  invitedAt: Date | string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!invitedAt) {
    // INVITED without invitedAt is treated as expired once persisted — fail closed.
    return true;
  }
  const invited = invitedAt instanceof Date ? invitedAt : new Date(invitedAt);
  if (Number.isNaN(invited.getTime())) {
    return true;
  }
  return now.getTime() > computeInvitationExpiresAt(invited).getTime();
}

export const INVITATION_EXPIRED_MESSAGE =
  'This invitation has expired. Ask an administrator to resend the invitation.';
