export const DEFAULT_LIST_PAGE_SIZE = 100;
export const MAX_LIST_PAGE_SIZE = 500;
/** Cap for list endpoints when the client does not request explicit pagination. */
export const MAX_UNPAGINATED_LIST_ROWS = 2000;

export interface ListQueryParams {
  page: number;
  pageSize: number;
  offset: number;
}

export interface PaginatedListResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseListQuery(query: Record<string, unknown>): ListQueryParams | null {
  if (query.pageSize === undefined && query.limit === undefined && query.page === undefined) {
    return null;
  }

  const pageSize = Math.min(
    MAX_LIST_PAGE_SIZE,
    parsePositiveInt(query.pageSize ?? query.limit, DEFAULT_LIST_PAGE_SIZE),
  );
  const page = parsePositiveInt(query.page, 1);

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  };
}

export function resolveListLimit(explicit?: ListQueryParams | null): number {
  return explicit?.pageSize ?? MAX_UNPAGINATED_LIST_ROWS;
}

export function resolveListOffset(explicit?: ListQueryParams | null): number {
  return explicit?.offset ?? 0;
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  params: ListQueryParams,
): PaginatedListResult<T> {
  return {
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
  };
}
