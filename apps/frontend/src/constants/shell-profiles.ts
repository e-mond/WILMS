export const SHELL_PROFILE = {
  OFFICE: 'office',
  FIELD: 'field',
} as const;

export type ShellProfile = (typeof SHELL_PROFILE)[keyof typeof SHELL_PROFILE];
