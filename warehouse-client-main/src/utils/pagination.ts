/**
 * Helper function để extract data từ pagination response
 * Hỗ trợ cả response mới (có pagination) và response cũ (array trực tiếp)
 */
export function extractDataFromResponse<T>(
  response: { data: T[]; pagination?: any } | T[] | undefined
): T[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (typeof response === 'object' && 'data' in response) {
    return response.data;
  }
  return [];
}

/**
 * Helper function để extract pagination metadata từ response
 */
export function extractPaginationFromResponse<T>(
  response: { data: T[]; pagination?: any } | T[] | undefined
): { page: number; pageSize: number; totalCount: number; totalPages: number } | null {
  if (!response) return null;
  if (Array.isArray(response)) return null;
  if (typeof response === 'object' && 'pagination' in response) {
    return response.pagination || null;
  }
  return null;
}
