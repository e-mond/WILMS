export function calculateWeeklyPaymentPesewas(
  amountPesewas: number,
  durationWeeks: number,
): number {
  return Math.floor(amountPesewas / durationWeeks);
}
