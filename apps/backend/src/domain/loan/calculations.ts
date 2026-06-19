export function calculateWeeklyPaymentPesewas(
  amountPesewas: number,
  durationWeeks: number,
): number {
  return Math.floor(amountPesewas / durationWeeks);
}

export function assertDivisibleLoanAmount(amountPesewas: number, durationWeeks: number): void {
  if (amountPesewas % durationWeeks !== 0) {
    throw new Error('VALIDATION:Loan amount must divide evenly across all weeks.');
  }
}
