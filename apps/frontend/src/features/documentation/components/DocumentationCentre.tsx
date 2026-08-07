'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Link2,
  Maximize2,
  Minimize2,
  Printer,
  Search,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import {
  CURRENT_DOC_VERSION,
  DOC_CATEGORY_LABELS,
  DOC_VERSIONS,
  DOCUMENTATION_BOOKS,
  DOCUMENTATION_STATS,
  documentationAssetUrl,
  getDocumentationBook,
  type DocCategory,
  type DocumentationBook,
} from '@/features/documentation/catalog';
import { DocMarkdown } from '@/features/documentation/components/DocMarkdown';
import { useDocumentationLibraryState } from '@/features/documentation/hooks/useDocumentationLibraryState';
import {
  estimateReadingMinutes,
  extractHeadings,
  searchMarkdown,
  type DocHeading,
} from '@/features/documentation/utils/doc-content';
import { useShellAsideContent } from '@/hooks/useShellAsideContent';
import { cn } from '@/utils/cn';

type SearchHit = {
  bookId: string;
  bookTitle: string;
  heading: string;
  snippet: string;
  score: number;
};

function groupBooksByCategory(books: DocumentationBook[]) {
  const order: DocCategory[] = [
    'product',
    'financial',
    'technical',
    'security',
    'reporting',
    'notifications',
    'operations',
    'guides',
    'developer',
    'roadmap',
    'procurement',
  ];
  return order
    .map((category) => ({
      category,
      label: DOC_CATEGORY_LABELS[category],
      books: books.filter((book) => book.category === category),
    }))
    .filter((group) => group.books.length > 0);
}

export function DocumentationCentre({ initialBookId }: { initialBookId?: string }) {
  const [selectedId, setSelectedId] = useState(initialBookId ?? DOCUMENTATION_BOOKS[0]?.id ?? '');
  const [markdown, setMarkdown] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [query, setQuery] = useState('');
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [version, setVersion] = useState(CURRENT_DOC_VERSION);
  const [presentation, setPresentation] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [activeHeading, setActiveHeading] = useState<string>('');
  const {
    bookmarks,
    favourites,
    progress,
    toggleBookmark,
    markRecent,
    toggleFavourite,
    saveProgress,
  } = useDocumentationLibraryState();

  const book = getDocumentationBook(selectedId) ?? DOCUMENTATION_BOOKS[0];
  const groups = useMemo(() => groupBooksByCategory(DOCUMENTATION_BOOKS), []);
  const headings = useMemo(() => extractHeadings(markdown), [markdown]);
  const readingMinutes = useMemo(() => estimateReadingMinutes(markdown), [markdown]);
  const bookIndex = DOCUMENTATION_BOOKS.findIndex((entry) => entry.id === book?.id);
  const prevBook = bookIndex > 0 ? DOCUMENTATION_BOOKS[bookIndex - 1] : null;
  const nextBook =
    bookIndex >= 0 && bookIndex < DOCUMENTATION_BOOKS.length - 1
      ? DOCUMENTATION_BOOKS[bookIndex + 1]
      : null;

  const asideContent = useMemo(() => {
    if (presentation || !book) return null;
    return (
      <div className="space-y-wilms-4" data-testid="documentation-aside-toc">
        <div>
          <p className="text-small font-semibold uppercase tracking-wide text-text-muted">
            On this page
          </p>
          <p className="mt-wilms-1 text-small text-text-primary">{book.shortTitle}</p>
          <TocList
            headings={headings}
            activeHeading={activeHeading}
            bookmarks={bookmarks}
            onToggleBookmark={toggleBookmark}
          />
        </div>
        <div className="border-t border-border pt-wilms-4">
          <p className="text-small font-semibold text-text-primary">Quick actions</p>
          <ul className="mt-wilms-2 space-y-2 text-small text-text-muted">
            <li>Download PDF or Word from the toolbar</li>
            <li>Use Present for board reviews</li>
            <li>Bookmark headings for later</li>
            <li>Open from Operations → Documentation Centre</li>
          </ul>
        </div>
      </div>
    );
  }, [activeHeading, book, bookmarks, headings, presentation, toggleBookmark]);

  useShellAsideContent(asideContent);

  const loadBook = useCallback(
    async (target: DocumentationBook) => {
      setIsLoading(true);
      setIsError(false);
      try {
        const response = await fetch(documentationAssetUrl('markdown', target), {
          cache: 'force-cache',
        });
        if (!response.ok) throw new Error('Unable to load document');
        const text = await response.text();
        setMarkdown(text);
        markRecent(target.id);
      } catch {
        setMarkdown('');
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [markRecent],
  );

  useEffect(() => {
    if (!book) return;
    void loadBook(book);
  }, [book, loadBook]);

  useEffect(() => {
    if (!presentation) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPresentation(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [presentation]);

  useEffect(() => {
    const onScroll = () => {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>('.doc-heading[id]'));
      let current = nodes[0]?.id ?? '';
      for (const node of nodes) {
        if (node.getBoundingClientRect().top <= 140) current = node.id;
      }
      setActiveHeading(current);
      if (book) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        saveProgress(book.id, max > 0 ? (window.scrollY / max) * 100 : 0);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [book, saveProgress, markdown]);

  const runSearch = useCallback(async (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setSearchHits([]);
      return;
    }
    setIsSearching(true);
    try {
      const settled = await Promise.all(
        DOCUMENTATION_BOOKS.map(async (entry) => {
          try {
            const response = await fetch(documentationAssetUrl('markdown', entry), {
              cache: 'force-cache',
            });
            if (!response.ok) return [] as SearchHit[];
            const text = await response.text();
            return searchMarkdown(text, entry.id, entry.title, value);
          } catch {
            return [] as SearchHit[];
          }
        }),
      );
      setSearchHits(
        settled
          .flat()
          .sort((a, b) => b.score - a.score)
          .slice(0, 24),
      );
    } finally {
      setIsSearching(false);
    }
  }, []);

  const copySectionLink = async () => {
    const hash = activeHeading ? `#${activeHeading}` : '';
    const url = `${window.location.origin}/documentation?book=${book?.id ?? ''}${hash}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Ignore clipboard failures.
    }
  };

  if (!book) {
    return <p className="p-wilms-6 text-text-muted">No documentation books are available.</p>;
  }

  return (
    <div
      className={cn(
        'documentation-centre w-full min-w-0',
        presentation && 'fixed inset-0 z-[80] overflow-auto bg-background px-wilms-4 py-wilms-6 md:px-wilms-8',
      )}
      data-testid="documentation-centre"
    >
      {!presentation ? (
        <header className="mb-wilms-5 w-full overflow-hidden rounded-sm border border-[color-mix(in_srgb,var(--color-brand-primary)_35%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-brand-primary)_18%,var(--color-card)),var(--color-card)_55%)] p-wilms-5 md:p-wilms-6">
          <p className="text-small font-semibold uppercase tracking-[0.14em] text-brand-primary">
            Documentation Centre · v{DOCUMENTATION_STATS.libraryVersion}
          </p>
          <h1 className="font-doc-display mt-wilms-2 text-heading-1 font-semibold tracking-tight text-text-primary md:text-[2.25rem]">
            WILMS Documentation Centre
          </h1>
          <p className="mt-wilms-3 max-w-3xl text-body text-text-muted">
            Official product, technical, operational, and administrative documentation for the
            Women’s Interest-Free Loan Management System.
          </p>
          <dl className="mt-wilms-5 grid gap-wilms-3 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="Version" value={DOCUMENTATION_STATS.libraryVersion} />
            <Stat label="Platform baseline" value={DOCUMENTATION_STATS.platformBaseline} />
            <Stat label="Books" value={String(DOCUMENTATION_STATS.bookCount)} />
            <Stat label="Est. pages" value={String(DOCUMENTATION_STATS.estimatedPages)} />
            <Stat label="Status" value={DOCUMENTATION_STATS.status} />
          </dl>
          <div className="mt-wilms-5 flex flex-col gap-wilms-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                aria-hidden
              />
              <Input
                className="min-h-[44px] pl-10"
                placeholder="Search titles, headings, glossary, API names…"
                value={query}
                onChange={(event) => void runSearch(event.target.value)}
                aria-label="Search documentation"
              />
            </div>
            <label className="block shrink-0 text-small text-text-muted">
              Documentation version
              <Select
                className="mt-1 min-h-[44px] w-full sm:w-40"
                value={version}
                onChange={(event) => setVersion(event.target.value as typeof version)}
                aria-label="Documentation version"
              >
                {DOC_VERSIONS.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry === CURRENT_DOC_VERSION ? `${entry} (latest)` : entry}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          {query.trim().length >= 2 ? (
            <div
              className="mt-wilms-4 rounded-sm border border-border bg-card/90 p-wilms-3"
              role="region"
              aria-live="polite"
              aria-label="Search results"
            >
              <p className="text-small font-semibold text-text-primary">
                {isSearching ? 'Searching…' : `${searchHits.length} results`}
              </p>
              <ul className="mt-wilms-2 max-h-56 space-y-2 overflow-y-auto">
                {searchHits.map((hit, index) => (
                  <li key={`${hit.bookId}-${hit.heading}-${index}`}>
                    <button
                      type="button"
                      className="min-h-[44px] w-full rounded-sm px-wilms-2 py-wilms-2 text-left hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary"
                      onClick={() => {
                        setSelectedId(hit.bookId);
                        setQuery('');
                        setSearchHits([]);
                        setLibraryOpen(false);
                      }}
                    >
                      <p className="text-small font-semibold text-brand-primary">{hit.bookTitle}</p>
                      <p className="text-small text-text-primary">{hit.heading}</p>
                      <p className="text-small text-text-muted">{hit.snippet}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </header>
      ) : (
        <div className="mb-wilms-4 flex items-center justify-between print:hidden">
          <p className="text-small font-semibold uppercase tracking-wide text-brand-primary">
            Presentation mode
          </p>
          <Button type="button" variant="secondary" className="min-h-[44px]" onClick={() => setPresentation(false)}>
            <Minimize2 className="mr-2 h-4 w-4" aria-hidden />
            Exit presentation
          </Button>
        </div>
      )}

      <div
        className={cn(
          'grid w-full min-w-0 gap-wilms-4',
          presentation ? 'grid-cols-1' : 'lg:grid-cols-[minmax(15rem,17.5rem)_minmax(0,1fr)]',
        )}
      >
        {!presentation ? (
          <aside
            id="documentation-library-nav"
            className={cn(
              'min-w-0 rounded-sm border border-border bg-card p-wilms-3 print:hidden lg:sticky lg:top-wilms-4 lg:self-start',
              libraryOpen ? 'block' : 'hidden lg:block',
            )}
          >
            <div className="mb-wilms-3 flex items-center justify-between gap-wilms-2 lg:block">
              <p className="text-small font-semibold uppercase tracking-wide text-text-muted">
                Library
              </p>
              <Button
                type="button"
                variant="secondary"
                className="min-h-[44px] lg:hidden"
                onClick={() => setLibraryOpen(false)}
              >
                Close
              </Button>
            </div>
            <nav
              aria-label="Documentation books"
              className="max-h-[min(70vh,40rem)] space-y-wilms-4 overflow-y-auto overscroll-contain pr-1"
            >
              {groups.map((group) => (
                <div key={group.category}>
                  <p className="mb-wilms-2 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-text-muted">
                    {group.label} · {group.books.length}
                  </p>
                  <ul className="space-y-1">
                    {group.books.map((entry) => {
                      const active = entry.id === book.id;
                      const fav = favourites.includes(entry.id);
                      return (
                        <li key={entry.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedId(entry.id);
                              setLibraryOpen(false);
                            }}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                              'flex min-h-[44px] w-full items-start gap-2 rounded-sm px-wilms-2 py-wilms-2 text-left text-small transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary',
                              active
                                ? 'bg-brand-primary/10 font-semibold text-brand-primary'
                                : 'text-text-primary hover:bg-background',
                            )}
                          >
                            <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate">{entry.shortTitle}</span>
                              {progress[entry.id] ? (
                                <span
                                  className="mt-1 block h-1 overflow-hidden rounded-full bg-border"
                                  aria-hidden
                                >
                                  <span
                                    className="block h-full bg-brand-primary"
                                    style={{ width: `${progress[entry.id]}%` }}
                                  />
                                </span>
                              ) : null}
                            </span>
                            {fav ? (
                              <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-current" aria-label="Favourite" />
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>
        ) : null}

        <section className="min-w-0" aria-label="Document reader">
          {!presentation ? (
            <div className="mb-wilms-3 flex items-center gap-wilms-2 lg:hidden print:hidden">
              <Button
                type="button"
                variant="secondary"
                className="min-h-[44px]"
                aria-expanded={libraryOpen}
                aria-controls="documentation-library-nav"
                onClick={() => setLibraryOpen((open) => !open)}
              >
                <BookOpen className="mr-2 h-4 w-4" aria-hidden />
                {libraryOpen ? 'Hide library' : 'Browse library'}
              </Button>
              <p className="min-w-0 truncate text-small text-text-muted">{book.shortTitle}</p>
            </div>
          ) : null}

          {!presentation ? (
            <div
              className="mb-wilms-4 flex flex-wrap items-center gap-wilms-2 rounded-sm border border-border bg-card px-wilms-3 py-wilms-3 print:hidden"
              role="toolbar"
              aria-label="Document actions"
            >
              <Button type="button" variant="secondary" className="min-h-[44px]" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" aria-hidden />
                Print
              </Button>
              <a
                className="inline-flex min-h-[44px] items-center rounded-sm border border-border px-wilms-3 text-small font-semibold text-text-primary hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary"
                href={documentationAssetUrl('pdf', book)}
                download
              >
                <Download className="mr-2 h-4 w-4" aria-hidden />
                PDF
              </a>
              <a
                className="inline-flex min-h-[44px] items-center rounded-sm border border-border px-wilms-3 text-small font-semibold text-text-primary hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary"
                href={documentationAssetUrl('docx', book)}
                download
              >
                <FileText className="mr-2 h-4 w-4" aria-hidden />
                Word
              </a>
              <Button type="button" variant="secondary" className="min-h-[44px]" onClick={() => void copySectionLink()}>
                <Link2 className="mr-2 h-4 w-4" aria-hidden />
                Copy link
              </Button>
              <Button type="button" variant="secondary" className="min-h-[44px]" onClick={() => setPresentation(true)}>
                <Maximize2 className="mr-2 h-4 w-4" aria-hidden />
                Present
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="min-h-[44px]"
                onClick={() => toggleFavourite(book.id)}
                aria-pressed={favourites.includes(book.id)}
              >
                <Star
                  className={cn(
                    'mr-2 h-4 w-4',
                    favourites.includes(book.id) && 'fill-current text-brand-primary',
                  )}
                  aria-hidden
                />
                Favourite
              </Button>
              <span className="w-full text-small text-text-muted sm:ml-auto sm:w-auto">
                About {readingMinutes} min · {book.classification}
              </span>
            </div>
          ) : null}

          <article className="w-full rounded-sm border border-border bg-card px-wilms-4 py-wilms-5 sm:px-wilms-6 sm:py-wilms-6 md:px-wilms-8 md:py-wilms-8 print:border-0">
            <DocCover book={book} version={version} />
            <QueryStatePanel
              isLoading={isLoading}
              showLoading={isLoading}
              isError={isError}
              errorMessage="Unable to load this document from the Documentation Centre library."
              onRetry={() => void loadBook(book)}
              variant="inline"
            >
              <div className="mx-auto w-full max-w-4xl">
                <DocMarkdown markdown={markdown} />
              </div>
            </QueryStatePanel>
          </article>

          {!presentation ? (
            <nav
              className="mt-wilms-4 flex flex-col gap-wilms-3 sm:flex-row sm:items-center sm:justify-between print:hidden"
              aria-label="Adjacent documents"
            >
              {prevBook ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-[44px] justify-start"
                  onClick={() => setSelectedId(prevBook.id)}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" aria-hidden />
                  Previous: {prevBook.shortTitle}
                </Button>
              ) : (
                <span />
              )}
              {nextBook ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-[44px] justify-end sm:ml-auto"
                  onClick={() => setSelectedId(nextBook.id)}
                >
                  Next: {nextBook.shortTitle}
                  <ChevronRight className="ml-2 h-4 w-4" aria-hidden />
                </Button>
              ) : null}
            </nav>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border/70 bg-card/70 px-wilms-3 py-wilms-3">
      <dt className="text-small text-text-muted">{label}</dt>
      <dd className="mt-1 text-body font-semibold text-text-primary">{value}</dd>
    </div>
  );
}

function DocCover({ book, version }: { book: DocumentationBook; version: string }) {
  return (
    <header className="mb-wilms-8 overflow-hidden rounded-sm border border-brand-primary/30 bg-[linear-gradient(160deg,#0F6E56_0%,#0b3d31_55%,#082820_100%)] px-wilms-6 py-wilms-8 text-white print:break-after-page">
      <p className="text-small font-semibold uppercase tracking-[0.18em] text-emerald-100/90">
        WILMS
      </p>
      <h2 className="font-doc-display mt-wilms-4 max-w-3xl text-[2rem] font-semibold leading-tight md:text-[2.4rem]">
        {book.title}
      </h2>
      <p className="mt-wilms-3 max-w-2xl text-body text-emerald-50/90">{book.description}</p>
      <dl className="mt-wilms-6 grid gap-wilms-3 text-small sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-emerald-100/70">Version</dt>
          <dd className="font-semibold">v{version}</dd>
        </div>
        <div>
          <dt className="text-emerald-100/70">Published</dt>
          <dd className="font-semibold">{DOCUMENTATION_STATS.lastUpdated}</dd>
        </div>
        <div>
          <dt className="text-emerald-100/70">Audience</dt>
          <dd className="font-semibold">{book.audience}</dd>
        </div>
        <div>
          <dt className="text-emerald-100/70">Classification</dt>
          <dd className="font-semibold">{book.classification}</dd>
        </div>
      </dl>
      <p className="mt-wilms-6 text-small text-emerald-100/80">
        Official system documentation · Women’s Interest-Free Loan Management System
      </p>
    </header>
  );
}

function TocList({
  headings,
  activeHeading,
  bookmarks,
  onToggleBookmark,
}: {
  headings: DocHeading[];
  activeHeading: string;
  bookmarks: string[];
  onToggleBookmark: (id: string) => void;
}) {
  if (headings.length === 0) {
    return <p className="mt-wilms-3 text-small text-text-muted">No headings available.</p>;
  }

  return (
    <ul className="mt-wilms-3 max-h-[min(60vh,32rem)] space-y-1 overflow-y-auto overscroll-contain pr-1">
      {headings.slice(0, 80).map((heading) => (
        <li key={heading.id} className="flex items-start gap-1">
          <a
            href={`#${heading.id}`}
            className={cn(
              'min-h-[40px] min-w-0 flex-1 rounded-sm px-wilms-2 py-2 text-small leading-snug hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary',
              heading.level === 1 && 'font-semibold',
              heading.level === 2 && 'pl-wilms-3',
              heading.level >= 3 && 'pl-wilms-5 text-text-muted',
              activeHeading === heading.id && 'bg-brand-primary/10 text-brand-primary',
            )}
          >
            {heading.text}
          </a>
          <button
            type="button"
            aria-label={`Bookmark ${heading.text}`}
            aria-pressed={bookmarks.includes(heading.id)}
            className="mt-1 inline-flex min-h-[40px] min-w-[40px] items-center justify-center text-text-muted hover:text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary"
            onClick={() => onToggleBookmark(heading.id)}
          >
            <Star
              className={cn('h-3.5 w-3.5', bookmarks.includes(heading.id) && 'fill-current text-brand-primary')}
              aria-hidden
            />
          </button>
        </li>
      ))}
    </ul>
  );
}
