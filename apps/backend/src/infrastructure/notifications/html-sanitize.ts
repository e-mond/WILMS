const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4',
  'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table',
  'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'span', 'div',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height', 'style']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan']),
  '*': new Set(['style', 'class']),
};

function stripDangerousProtocols(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:text/html')) {
    return '#';
  }
  return value;
}

/** Lightweight HTML sanitizer for composed message bodies. */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/<(\/?)([\w-]+)([^>]*)>/gi, (match, slash, tag, attrs) => {
      const tagName = tag.toLowerCase();
      if (!ALLOWED_TAGS.has(tagName)) {
        return '';
      }
      if (slash) {
        return `</${tagName}>`;
      }

      const safeAttrs = attrs.replace(
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
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}
