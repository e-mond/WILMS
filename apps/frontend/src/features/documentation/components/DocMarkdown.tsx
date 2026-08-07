'use client';

import { useMemo, type ReactNode } from 'react';
import { MermaidDiagram } from '@/features/documentation/components/MermaidDiagram';
import { slugifyHeading } from '@/features/documentation/utils/doc-content';
import { cn } from '@/utils/cn';

type Block =
  | { type: 'heading'; level: number; text: string; id: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'code'; language: string; code: string }
  | { type: 'blockquote'; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'hr' }
  | { type: 'callout'; tone: CalloutTone; title: string; text: string };

type CalloutTone = 'note' | 'warning' | 'important' | 'tip' | 'security';

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1');
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith('**')) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`')) {
      nodes.push(
        <code
          key={key}
          className="rounded-sm bg-background px-1.5 py-0.5 font-mono text-[0.92em] text-brand-primary"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const link = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
      if (link) {
        nodes.push(
          <a
            key={key}
            href={link[2]}
            className="font-semibold text-brand-primary underline-offset-2 hover:underline"
          >
            {link[1]}
          </a>,
        );
      }
    }
    key += 1;
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function detectCallout(text: string): Block | null {
  const patterns: Array<{ match: RegExp; tone: CalloutTone; title: string }> = [
    { match: /^\*\*Note:\*\*\s*/i, tone: 'note', title: 'Note' },
    { match: /^\*\*Warning:\*\*\s*/i, tone: 'warning', title: 'Warning' },
    { match: /^\*\*Important:\*\*\s*/i, tone: 'important', title: 'Important' },
    { match: /^\*\*Best Practice:\*\*\s*/i, tone: 'tip', title: 'Best Practice' },
    { match: /^\*\*Security:\*\*\s*/i, tone: 'security', title: 'Security Consideration' },
    { match: /^\*\*Tip:\*\*\s*/i, tone: 'tip', title: 'Tip' },
  ];
  for (const pattern of patterns) {
    if (pattern.match.test(text)) {
      return {
        type: 'callout',
        tone: pattern.tone,
        title: pattern.title,
        text: text.replace(pattern.match, '').trim(),
      };
    }
  }
  return null;
}

function parseMarkdownBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  const seen = new Map<string, number>();

  const headingId = (text: string) => {
    let id = slugifyHeading(text);
    const count = (seen.get(id) ?? 0) + 1;
    seen.set(id, count);
    if (count > 1) id = `${id}-${count}`;
    return id;
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ type: 'code', language, code: codeLines.join('\n') });
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(trimmed);
    if (heading) {
      const text = stripInlineMarkdown(heading[2]);
      blocks.push({
        type: 'heading',
        level: heading[1].length,
        text,
        id: headingId(text),
      });
      i += 1;
      continue;
    }

    if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      i += 1;
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quote.push(lines[i].trim().replace(/^>\s?/, ''));
        i += 1;
      }
      blocks.push({ type: 'blockquote', text: quote.join(' ') });
      continue;
    }

    if (trimmed.includes('|') && trimmed.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().includes('|')) {
        tableLines.push(lines[i].trim());
        i += 1;
      }
      const parseRow = (row: string) =>
        row
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((cell) => cell.trim());
      const headers = parseRow(tableLines[0] ?? '');
      const bodyRows = tableLines
        .slice(2)
        .filter((row) => !/^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(row))
        .map(parseRow);
      blocks.push({ type: 'table', headers, rows: bodyRows });
      continue;
    }

    if (/^[-*+]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const ordered = /^\d+\.\s+/.test(trimmed);
      const items: string[] = [];
      while (i < lines.length) {
        const item = lines[i].trim();
        if (!item) break;
        if (ordered && !/^\d+\.\s+/.test(item)) break;
        if (!ordered && !/^[-*+]\s+/.test(item)) break;
        items.push(item.replace(/^([- *+]|\d+\.)\s+/, ''));
        i += 1;
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    const paragraph: string[] = [];
    while (i < lines.length) {
      const current = lines[i];
      if (!current.trim()) break;
      if (
        current.trim().startsWith('#') ||
        current.trim().startsWith('```') ||
        current.trim().startsWith('|') ||
        current.trim().startsWith('>') ||
        /^[-*+]\s+/.test(current.trim()) ||
        /^\d+\.\s+/.test(current.trim()) ||
        /^---+$/.test(current.trim())
      ) {
        break;
      }
      paragraph.push(current.trim());
      i += 1;
    }
    const text = paragraph.join(' ');
    const callout = detectCallout(text);
    blocks.push(callout ?? { type: 'paragraph', text });
  }

  return blocks;
}

function Callout({
  tone,
  title,
  children,
}: {
  tone: CalloutTone;
  title: string;
  children: ReactNode;
}) {
  const tones = {
    note: 'border-status-info/40 bg-status-info/5',
    warning: 'border-status-at-risk/50 bg-status-at-risk/10',
    important: 'border-brand-primary/40 bg-brand-primary/5',
    tip: 'border-status-active/40 bg-status-active/5',
    security: 'border-danger/40 bg-danger/5',
  } as const;

  return (
    <aside className={cn('my-wilms-5 rounded-sm border px-wilms-4 py-wilms-3', tones[tone])}>
      <p className="text-small font-semibold uppercase tracking-wide text-text-primary">{title}</p>
      <div className="mt-wilms-2 text-body text-text-muted">{children}</div>
    </aside>
  );
}

export function DocMarkdown({ markdown }: { markdown: string }) {
  const blocks = useMemo(() => parseMarkdownBlocks(markdown), [markdown]);

  return (
    <div className="documentation-prose">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        switch (block.type) {
          case 'heading': {
            const className = cn(
              'doc-heading font-doc-display scroll-mt-28 text-text-primary',
              block.level === 1 &&
                'mt-wilms-10 border-b border-border/60 pb-wilms-3 text-[2rem] font-semibold tracking-tight first:mt-0 md:text-[2.35rem]',
              block.level === 2 && 'mt-wilms-9 text-[1.55rem] font-semibold',
              block.level === 3 && 'mt-wilms-7 text-[1.2rem] font-semibold',
              block.level >= 4 && 'mt-wilms-5 text-body font-semibold',
            );
            if (block.level === 1) return <h1 key={key} id={block.id} className={className}>{block.text}</h1>;
            if (block.level === 2) return <h2 key={key} id={block.id} className={className}>{block.text}</h2>;
            if (block.level === 3) return <h3 key={key} id={block.id} className={className}>{block.text}</h3>;
            return <h4 key={key} id={block.id} className={className}>{block.text}</h4>;
          }
          case 'paragraph':
            return (
              <p key={key} className="font-doc-body my-wilms-4 text-[1.05rem] leading-[1.75] text-text-primary/90">
                {renderInline(block.text)}
              </p>
            );
          case 'list':
            return block.ordered ? (
              <ol key={key} className="font-doc-body my-wilms-4 list-decimal space-y-2 pl-wilms-6 text-[1.02rem] leading-relaxed text-text-primary/90">
                {block.items.map((item, itemIndex) => (
                  <li key={`${key}-${itemIndex}`}>{renderInline(item)}</li>
                ))}
              </ol>
            ) : (
              <ul key={key} className="font-doc-body my-wilms-4 list-disc space-y-2 pl-wilms-6 text-[1.02rem] leading-relaxed text-text-primary/90">
                {block.items.map((item, itemIndex) => (
                  <li key={`${key}-${itemIndex}`}>{renderInline(item)}</li>
                ))}
              </ul>
            );
          case 'code':
            if (block.language === 'mermaid') {
              return <MermaidDiagram key={key} chart={block.code} />;
            }
            return (
              <pre
                key={key}
                className="my-wilms-5 overflow-x-auto rounded-sm border border-border bg-[#0b1f17] p-wilms-4 text-small text-emerald-50"
              >
                <code>{block.code}</code>
              </pre>
            );
          case 'blockquote':
            return (
              <blockquote
                key={key}
                className="my-wilms-5 border-l-4 border-brand-primary/50 bg-brand-primary/5 py-wilms-3 pl-wilms-4 text-text-muted italic"
              >
                {renderInline(block.text)}
              </blockquote>
            );
          case 'table':
            return (
              <div key={key} className="my-wilms-6 overflow-x-auto rounded-sm border border-border">
                <table className="min-w-full border-collapse text-left text-small">
                  <thead className="bg-background/80 text-text-muted">
                    <tr>
                      {block.headers.map((header) => (
                        <th key={header} className="border-b border-border px-wilms-3 py-wilms-2 font-semibold">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={`${key}-row-${rowIndex}`} className="odd:bg-card even:bg-background/40">
                        {row.map((cell, cellIndex) => (
                          <td
                            key={`${key}-${rowIndex}-${cellIndex}`}
                            className="border-b border-border/70 px-wilms-3 py-wilms-2 align-top text-text-primary"
                          >
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'hr':
            return <hr key={key} className="my-wilms-8 border-border/70" />;
          case 'callout':
            return (
              <Callout key={key} tone={block.tone} title={block.title}>
                {renderInline(block.text)}
              </Callout>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
