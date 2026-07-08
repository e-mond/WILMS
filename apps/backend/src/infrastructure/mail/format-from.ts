/** Format RFC 5322 From header with display name (e.g. "WILMS - GH" <noreply@example.com>). */
export function formatMailFrom(address: string, displayName?: string): string {
  const email = address.trim();
  const name = (displayName ?? process.env.MAIL_FROM_NAME ?? 'WILMS - GH').trim();

  if (!email) {
    return name;
  }

  if (email.includes('<') && email.includes('>')) {
    return email;
  }

  return `"${name}" <${email}>`;
}
