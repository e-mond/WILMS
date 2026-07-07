/**
 * WILMS branded email template engine — responsive, table-based HTML for broad client support.
 */

export type EmailTheme = 'default' | 'success' | 'info' | 'warning' | 'critical';

export type EmailButtonVariant = 'primary' | 'success' | 'info' | 'warning' | 'critical';

const BRAND = {
  name: 'WILMS',
  tagline: "Women's Interest-Free Loan Management System",
  website: 'https://wilms.vercel.app',
  supportEmail: 'support@wilms.org',
  phone: '+233 XX XXX XXXX',
  year: new Date().getFullYear(),
};

const COLORS: Record<EmailTheme, { accent: string; bg: string; border: string }> = {
  default: { accent: '#1B5E4B', bg: '#F0FDF4', border: '#BBF7D0' },
  success: { accent: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  info: { accent: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  warning: { accent: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' },
  critical: { accent: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
};

const BUTTON_COLORS: Record<EmailButtonVariant, string> = {
  primary: '#1B5E4B',
  success: '#16A34A',
  info: '#2563EB',
  warning: '#EA580C',
  critical: '#DC2626',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function emailHeader(theme: EmailTheme = 'default'): string {
  const { accent } = COLORS[theme];
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
  <tr>
    <td style="background:${accent};border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:700;color:#ffffff;letter-spacing:2px;">WILMS</div>
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;color:rgba(255,255,255,0.85);margin-top:4px;">${escapeHtml(BRAND.tagline)}</div>
    </td>
  </tr>
</table>`.trim();
}

export function emailFooter(): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;border-top:1px solid #E2E8F0;padding-top:24px;">
  <tr>
    <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;color:#64748B;text-align:center;line-height:1.6;">
      <p style="margin:0 0 8px;"><strong>${escapeHtml(BRAND.name)}</strong> &mdash; ${escapeHtml(BRAND.tagline)}</p>
      <p style="margin:0 0 8px;">
        <a href="${BRAND.website}" style="color:#1B5E4B;text-decoration:none;">${BRAND.website.replace('https://', '')}</a>
        &nbsp;&bull;&nbsp; ${escapeHtml(BRAND.supportEmail)}
      </p>
      <p style="margin:0;color:#94A3B8;">&copy; ${BRAND.year} WILMS. All rights reserved.</p>
    </td>
  </tr>
</table>`.trim();
}

export function emailGreeting(name: string): string {
  return `<p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;color:#1E293B;margin:0 0 16px;">Dear <strong>${escapeHtml(name)}</strong>,</p>`;
}

export function emailParagraph(text: string): string {
  return `<p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;color:#334155;line-height:1.6;margin:0 0 16px;">${text}</p>`;
}

export function emailButton(label: string, url: string, variant: EmailButtonVariant = 'primary'): string {
  const bg = BUTTON_COLORS[variant];
  return `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="border-radius:8px;background:${bg};">
      <a href="${escapeHtml(url)}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`.trim();
}

export interface EmailCardRow {
  label: string;
  value: string;
}

export function emailCard(title: string, rows: EmailCardRow[]): string {
  const rowHtml = rows
    .map(
      (row) => `
    <tr>
      <td style="padding:10px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:#64748B;border-bottom:1px solid #F1F5F9;width:40%;">${escapeHtml(row.label)}</td>
      <td style="padding:10px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;color:#1E293B;font-weight:600;border-bottom:1px solid #F1F5F9;">${escapeHtml(row.value)}</td>
    </tr>`,
    )
    .join('');

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;">
  <tr>
    <td style="background:#F8FAFC;padding:12px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;font-weight:600;color:#1E293B;border-bottom:1px solid #E2E8F0;">${escapeHtml(title)}</td>
  </tr>
  ${rowHtml}
</table>`.trim();
}

export function emailAlert(message: string, variant: EmailTheme = 'info'): string {
  const { accent, bg, border } = COLORS[variant];
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
  <tr>
    <td style="background:${bg};border-left:4px solid ${accent};border-radius:0 8px 8px 0;padding:14px 18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;color:#334155;line-height:1.5;">${message}</td>
  </tr>
</table>`.trim();
}

export function emailSection(title: string, body: string): string {
  return `
<div style="margin:24px 0;">
  <h3 style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;color:#1E293B;margin:0 0 12px;font-weight:600;">${escapeHtml(title)}</h3>
  ${body}
</div>`.trim();
}

export function emailDivider(): string {
  return `<hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;" />`;
}

export function emailReceipt(rows: EmailCardRow[]): string {
  return emailCard('Receipt Details', rows);
}

export function emailSummary(title: string, items: string[]): string {
  const list = items.map((item) => `<li style="margin-bottom:6px;">${escapeHtml(item)}</li>`).join('');
  return emailSection(title, `<ul style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;color:#334155;line-height:1.6;margin:0;padding-left:20px;">${list}</ul>`);
}

export interface EmailLayoutInput {
  theme?: EmailTheme;
  greeting?: string;
  body: string;
  preheader?: string;
}

export function buildEmailHtml(input: EmailLayoutInput): string {
  const theme = input.theme ?? 'default';
  const greeting = input.greeting ? emailGreeting(input.greeting) : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>WILMS</title>
  ${input.preheader ? `<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(input.preheader)}</span>` : ''}
</head>
<body style="margin:0;padding:0;background:#F1F5F9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;">
          <tr>
            <td style="padding:0;">
              ${emailHeader(theme)}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 32px;">
              ${greeting}
              ${input.body}
              ${emailFooter()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

export function buildEmailTemplate(input: {
  subject: string;
  greeting?: string;
  textLines: string[];
  htmlBody: string;
  theme?: EmailTheme;
  preheader?: string;
}): EmailTemplate {
  const text = input.textLines.join('\n');
  const html = buildEmailHtml({
    theme: input.theme,
    greeting: input.greeting,
    body: input.htmlBody,
    preheader: input.preheader,
  });
  return { subject: input.subject, text, html };
}
