export function normalizeGhanaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 12 && digits.startsWith('233')) {
    return digits.slice(3);
  }

  if (digits.length === 10 && digits.startsWith('0')) {
    return digits.slice(1);
  }

  return digits;
}
