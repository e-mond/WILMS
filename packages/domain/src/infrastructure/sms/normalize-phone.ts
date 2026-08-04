export function normalizeGhanaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) {
    return '';
  }
  if (digits.startsWith('233')) {
    return digits;
  }
  if (digits.startsWith('0')) {
    return `233${digits.slice(1)}`;
  }
  return digits;
}

export function isValidGhanaMobile(phone: string): boolean {
  const normalized = normalizeGhanaPhone(phone);
  return /^233[2-5]\d{8}$/.test(normalized);
}
