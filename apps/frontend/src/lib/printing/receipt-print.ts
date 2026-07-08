export interface ReceiptPrintInput {
  title: string;
  lines: string[];
  footer?: string;
}

export function buildReceiptText(input: ReceiptPrintInput): string {
  const divider = '--------------------------------';
  return [input.title, divider, ...input.lines, divider, input.footer ?? 'WILMS - GH', ''].join('\n');
}

export function openPrintableReceipt(input: ReceiptPrintInput): void {
  const text = buildReceiptText(input);
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=420,height=720');
  if (!printWindow) {
    return;
  }

  printWindow.document.write(`<!doctype html>
<html>
  <head>
    <title>${input.title}</title>
    <style>
      body { font-family: ui-monospace, monospace; font-size: 12px; margin: 16px; }
      pre { white-space: pre-wrap; }
    </style>
  </head>
  <body>
    <pre>${text.replace(/</g, '&lt;')}</pre>
    <script>window.onload = () => { window.print(); };</script>
  </body>
</html>`);
  printWindow.document.close();
}

export async function shareReceiptText(input: ReceiptPrintInput): Promise<void> {
  const text = buildReceiptText(input);
  if (navigator.share) {
    await navigator.share({ title: input.title, text });
    return;
  }

  openPrintableReceipt(input);
}
