export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function parsePagination(query: { page?: string; pageSize?: string }) {
  const page = Math.max(Number(query.page ?? DEFAULT_PAGE) || DEFAULT_PAGE, 1);
  const requestedPageSize =
    Number(query.pageSize ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(Math.max(requestedPageSize, 1), MAX_PAGE_SIZE);

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}
