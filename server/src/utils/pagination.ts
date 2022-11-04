import { Request } from 'express';
import { Order } from 'sequelize';

export interface Pagination {
  page: number;
  pageSize: number;
  limit: number;
  offset: number;
}

export function paginate(query: Request['query']): Pagination {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 10));
  return { page, pageSize, limit: pageSize, offset: (page - 1) * pageSize };
}

export function sortOrder(
  query: Request['query'],
  columns: Record<string, string[]>,
  fallback: string,
  fallbackDir: 'ASC' | 'DESC' = 'ASC'
): Order {
  const requested = String(query.sortBy || '');
  const key = columns[requested] ? requested : fallback;
  const dir = query.sortDir
    ? String(query.sortDir).toUpperCase() === 'DESC'
      ? 'DESC'
      : 'ASC'
    : fallbackDir;
  return columns[key].map((column) => [column, dir]);
}

export function pageResult<T>(rows: T[], total: number, { page, pageSize }: Pagination) {
  return { items: rows, total, page, pageSize };
}
