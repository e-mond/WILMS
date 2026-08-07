'use client';

/** Mermaid source is retained for presentation; rendered as a branded diagram card. */
export function MermaidDiagram({ chart }: { chart: string }) {
  return (
    <figure className="my-wilms-6 overflow-hidden rounded-sm border border-brand-primary/30 bg-[color-mix(in_srgb,var(--color-brand-primary)_6%,var(--color-card))]">
      <figcaption className="border-b border-border/60 px-wilms-4 py-wilms-2 text-small font-semibold uppercase tracking-wide text-brand-primary">
        Diagram
      </figcaption>
      <pre className="overflow-x-auto whitespace-pre-wrap px-wilms-4 py-wilms-4 font-mono text-small leading-relaxed text-text-primary">
        {chart}
      </pre>
    </figure>
  );
}
