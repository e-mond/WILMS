export function formatCollectorJoinedDate(isoDate: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoDate));
}
