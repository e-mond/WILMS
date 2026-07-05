import { splitSearchHighlight } from '@/utils/search-match';

export interface HighlightedTextProps {
  text: string;
  query: string;
  className?: string;
}

export function HighlightedText({ text, query, className }: HighlightedTextProps) {
  const parts = splitSearchHighlight(text, query);

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.match ? (
          <mark
            key={`${part.text}-${index}`}
            className="rounded-sm bg-brand-primary/15 px-0.5 text-inherit"
          >
            {part.text}
          </mark>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        ),
      )}
    </span>
  );
}
