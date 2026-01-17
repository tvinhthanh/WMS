import { useState } from "react";

/**
 * Custom hook để quản lý pagination state
 */
export function usePagination(initialPage: number = 1, initialPageSize: number = 50) {
  const [page, setPage] = useState(initialPage);
  const [pageSize] = useState(initialPageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1) {
      setPage(newPage);
    }
  };

  const resetPagination = () => {
    setPage(1);
  };

  return {
    page,
    pageSize,
    setPage: handlePageChange,
    resetPagination,
  };
}
