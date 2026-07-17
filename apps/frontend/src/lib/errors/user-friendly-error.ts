export function presentUserFacingError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof Error && error.message.trim()) {
    const message = error.message.trim();
    if (/^(TypeError|ReferenceError|SyntaxError|Error:|at\s)/i.test(message)) {
      return fallback;
    }
    return message;
  }

  return fallback;
}

export const USER_FACING_ERRORS = {
  generic: 'Something went wrong. Please try again.',
  saveFailed: "We couldn't save your changes.",
  sessionExpired: 'Your session has expired. Please sign in again.',
  actionUnavailable: 'This action is not available right now.',
} as const;
