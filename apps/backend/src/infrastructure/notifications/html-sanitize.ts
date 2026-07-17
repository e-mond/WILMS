const ALLOWED_TAGS = new Set([
  'html',
  'head',
  'body',
  'meta',
  'title',
  'style',
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'h1',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'a',
  'img',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'hr',
  'span',
  'div',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height', 'style']),
  td: new Set(['colspan', 'rowspan', 'align', 'style', 'class']),
  th: new Set(['colspan', 'rowspan', 'align', 'style', 'class']),
  table: new Set(['role', 'width', 'cellpadding', 'cellspacing', 'border', 'align', 'style', 'class']),
  meta: new Set(['charset', 'name', 'content', 'http-equiv']),
  style: new Set(['type']),
  '*': new Set(['style', 'class', 'id', 'role', 'align', 'width', 'height']),
};

function stripDangerousProtocols(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:text/html')) {
    return '#';
  }
  return value;
}

/**
 * Sanitize HTML for outbound mail.
 * Preserves email document structure (`html`/`head`/`body`/`style`) so responsive
 * `@media` rules stay inside `<style>` instead of leaking as visible body text.
 */
export function sanitizeHtml(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Keep doctype as-is for email clients.
  const doctypeMatch = withoutScripts.match(/^<!DOCTYPE[^>]*>/i);
  const doctype = doctypeMatch?.[0] ?? '';
  const remainder = doctype ? withoutScripts.slice(doctype.length) : withoutScripts;

  const sanitized = remainder.replace(/<(\/?)([\w-]+)([^>]*)>/gi, (match, slash, tag, attrs) => {
    const tagName = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(tagName)) {
      return '';
    }
    if (slash) {
      return `</${tagName}>`;
    }

    const safeAttrs = String(attrs)
      .trim()
      .replace(
      /([\w-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi,
      (_full: string, name: string, _q: string, d1?: string, d2?: string, d3?: string) => {
        const attrName = name.toLowerCase();
        const allowed = ALLOWED_ATTRS[tagName] ?? ALLOWED_ATTRS['*'];
        const global = ALLOWED_ATTRS['*'];
        if (!allowed?.has(attrName) && !global?.has(attrName)) {
          return '';
        }
        const value = stripDangerousProtocols(d1 ?? d2 ?? d3 ?? '');
        return ` ${attrName}="${value.replace(/"/g, '&quot;')}"`;
      },
    );

    return `<${tagName}${safeAttrs}>`;
  });

  return `${doctype}${sanitized}`;
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}
