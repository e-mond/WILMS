'use client';

import { useEffect, useMemo, useState } from 'react';

const DEFAULT_PAGE_SIZE = 10;

export function usePaginatedRows<T>(rows: readonly T[], pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), pageCount);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const slice = useMemo(
    () => rows.slice((safePage - 1) * pageSize, safePage * pageSize),
    [rows, safePage, pageSize],
  );

  return {
    page: safePage,
    pageCount,
    pageSize,
    setPage,
    slice,
    total: rows.length,
  };
}
