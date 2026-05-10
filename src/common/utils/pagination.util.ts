import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
} from '../constants/pagination.constants';
import type { PaginationQuery } from '../../types/common/pagination.types';

export function parsePaginationQuery(
  page?: string,
  limit?: string,
): PaginationQuery {
  return {
    page: parsePositiveInteger(page, DEFAULT_PAGE),
    limit: parsePositiveInteger(limit, DEFAULT_LIMIT, MAX_LIMIT),
  };
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
  max?: number,
): number {
  if (value == null || value.trim().length === 0) {
    return fallback;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return fallback;
  }

  if (max != null && parsedValue > max) {
    return max;
  }

  return parsedValue;
}
