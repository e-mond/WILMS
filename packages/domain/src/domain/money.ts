export const CURRENCY_CODE = 'GHS';

export function pesewasToDecimal(pesewas: number): string {
  return (pesewas / 100).toFixed(2);
}

export function decimalToPesewas(value: string | number): number {
  return Math.round(Number(value) * 100);
}

export function parseDecimal(value: string | null | undefined): number {
  return Number(value ?? '0');
}
