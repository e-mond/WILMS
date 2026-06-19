export function formatPesewasAsGhs(pesewas: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
  }).format(pesewas / 100);
}
