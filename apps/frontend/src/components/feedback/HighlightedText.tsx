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
            className="rounded-xs bg-emerald-500/15 px-0.5 font-semibold text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-400"
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
