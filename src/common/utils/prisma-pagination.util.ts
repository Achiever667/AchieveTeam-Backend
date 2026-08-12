import { PaginatedData } from '../types/api-response.type';

export function buildPrismaPagination(
  page = 1,
  limit = 20,
  sort = 'createdAt',
  order: 'asc' | 'desc' = 'desc',
) {
  const take = Math.max(1, Math.min(limit, 100));
  const skip = (Math.max(1, page) - 1) * take;
  const orderBy: Record<string, any> = {};
  orderBy[sort] = order;

  return { take, skip, orderBy };
}

export function formatPaginated<T>(items: T[], total: number, page = 1, limit = 20): PaginatedData<T> {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}
