export type PaginationProps = {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
};

const Pagination = ({ page, pages, onPageChange }: PaginationProps) => {
  // Generate page numbers array
  const pageNumbers = Array.from({ length: pages }, (_, i) => i + 1);

  // Limit visible pages to avoid too many buttons
  const maxVisiblePages = 10;
  const startPage = Math.max(1, Math.min(page - Math.floor(maxVisiblePages / 2), pages - maxVisiblePages + 1));
  const endPage = Math.min(pages, startPage + maxVisiblePages - 1);
  const visiblePages = pageNumbers.slice(startPage - 1, endPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pages && newPage !== page) {
      onPageChange(newPage);
    }
  };

  return (
    <div className="flex justify-center items-center gap-2">
      {/* Previous button */}
      <button
        onClick={() => handlePageChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
        aria-label="Trang trước"
      >
        ‹
      </button>

      {/* First page */}
      {startPage > 1 && (
        <>
          <button
            onClick={() => handlePageChange(1)}
            className="px-3 py-1 border rounded hover:bg-gray-50 transition"
          >
            1
          </button>
          {startPage > 2 && <span className="px-2">...</span>}
        </>
      )}

      {/* Visible page numbers */}
      <ul className="flex border border-slate-300 rounded overflow-hidden">
        {visiblePages.map((number) => (
          <li key={number}>
            <button
              onClick={() => handlePageChange(number)}
              className={`px-3 py-1 min-w-[40px] transition ${
                page === number
                  ? "bg-blue-600 text-white font-semibold"
                  : "bg-white hover:bg-gray-50"
              }`}
              aria-label={`Trang ${number}`}
              aria-current={page === number ? "page" : undefined}
            >
              {number}
            </button>
          </li>
        ))}
      </ul>

      {/* Last page */}
      {endPage < pages && (
        <>
          {endPage < pages - 1 && <span className="px-2">...</span>}
          <button
            onClick={() => handlePageChange(pages)}
            className="px-3 py-1 border rounded hover:bg-gray-50 transition"
          >
            {pages}
          </button>
        </>
      )}

      {/* Next button */}
      <button
        onClick={() => handlePageChange(page + 1)}
        disabled={page === pages}
        className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
        aria-label="Trang sau"
      >
        ›
      </button>
    </div>
  );
};

export default Pagination;
