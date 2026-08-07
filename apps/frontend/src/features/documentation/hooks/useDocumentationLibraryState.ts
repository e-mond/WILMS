'use client';

import { useCallback, useEffect, useState } from 'react';

const BOOKMARKS_KEY = 'wilms-docs-bookmarks';
const RECENT_KEY = 'wilms-docs-recent';
const FAVOURITES_KEY = 'wilms-docs-favourites';
const PROGRESS_KEY = 'wilms-docs-progress';

function readJsonArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function writeJsonArray(key: string, values: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(values.slice(0, 40)));
  } catch {
    // Ignore storage failures.
  }
}

export function useDocumentationLibraryState() {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [favourites, setFavourites] = useState<string[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    setBookmarks(readJsonArray(BOOKMARKS_KEY));
    setRecent(readJsonArray(RECENT_KEY));
    setFavourites(readJsonArray(FAVOURITES_KEY));
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      setProgress(raw ? (JSON.parse(raw) as Record<string, number>) : {});
    } catch {
      setProgress({});
    }
  }, []);

  const toggleBookmark = useCallback((headingId: string) => {
    setBookmarks((prev) => {
      const next = prev.includes(headingId)
        ? prev.filter((id) => id !== headingId)
        : [headingId, ...prev];
      writeJsonArray(BOOKMARKS_KEY, next);
      return next;
    });
  }, []);

  const markRecent = useCallback((bookId: string) => {
    setRecent((prev) => {
      const next = [bookId, ...prev.filter((id) => id !== bookId)];
      writeJsonArray(RECENT_KEY, next);
      return next;
    });
  }, []);

  const toggleFavourite = useCallback((bookId: string) => {
    setFavourites((prev) => {
      const next = prev.includes(bookId)
        ? prev.filter((id) => id !== bookId)
        : [bookId, ...prev];
      writeJsonArray(FAVOURITES_KEY, next);
      return next;
    });
  }, []);

  const saveProgress = useCallback((bookId: string, percent: number) => {
    setProgress((prev) => {
      const next = { ...prev, [bookId]: Math.min(100, Math.max(0, Math.round(percent))) };
      try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
      } catch {
        // Ignore.
      }
      return next;
    });
  }, []);

  return {
    bookmarks,
    recent,
    favourites,
    progress,
    toggleBookmark,
    markRecent,
    toggleFavourite,
    saveProgress,
  };
}
