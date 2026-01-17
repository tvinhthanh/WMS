// pages/danhmuc/Danhmuc.tsx
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import Table, { Column } from "../../../components/Table";
import CategoryModal from "./DanhmucModal";
import { ProductCategoryDTO, ProductDTO } from "../../../types";
import { categoryService } from "../../../services/category.service";
import { productService } from "../../../services/product.service";
import { inventoryService } from "../../../services/inventory.service";

const Danhmuc = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<ProductCategoryDTO | null>(null);

  const queryClient = useQueryClient();

  // GET ALL CATEGORIES
  const { data: categories = [], isLoading, isError } = useQuery(
    "categories",
    categoryService.getAll
  );

  // GET ALL PRODUCTS (to compute counts per category)
  const { data: products = [] } = useQuery("products", productService.getAll);

  // GET INVENTORY (to compute total quantities per category)
  const { data: inventories = [] } = useQuery("inventories", inventoryService.getAll);

  // DELETE
  const deleteMutation = useMutation(categoryService.delete, {
  onSuccess: () => {
    queryClient.invalidateQueries("categories");
    alert("Xóa danh mục thành công");
  },
  onError: (error: any) => {
    alert(error.message); // 🔥 hiển thị lỗi backend
  },
});


  // FILTER + SORT
  const filteredCategories = categories
    .filter((cat) =>
      cat.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.categoryName.localeCompare(b.categoryName);
        case "name-desc":
          return b.categoryName.localeCompare(a.categoryName);
        default:
          return 0;
      }
    });

  const handleDelete = (id: number) => {
    if (window.confirm("Bạn có chắc muốn xóa danh mục này?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAdd = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category: ProductCategoryDTO) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const totalQtyByCategory = useMemo(() => {
    const qtyByProduct = (inventories as any[]).reduce<Record<number, number>>((acc, inv) => {
      acc[inv.productId] = (acc[inv.productId] || 0) + (inv.quantity || 0);
      return acc;
    }, {});

    return (products as ProductDTO[]).reduce<Record<number, number>>((acc, p) => {
      acc[p.categoryId] = (acc[p.categoryId] || 0) + (qtyByProduct[p.productId] || 0);
      return acc;
    }, {});
  }, [products, inventories]);

  const columns: Column<ProductCategoryDTO>[] = [
    { title: "ID", dataIndex: "categoryId" },
    { title: "Tên danh mục", dataIndex: "categoryName" },

    { title: "Số lượng sản phẩm", render: (_, row) => totalQtyByCategory[row.categoryId] ?? 0 },
     
    // bao nhiêu mặc hàng trong danh mục
    /*{
      title: "Tổng số sản phẩm",
      render: (_, row) => {
        const counts = (products as ProductDTO[]).reduce<Record<number, number>>(
          (acc, p) => {
            acc[p.categoryId] = (acc[p.categoryId] || 0) + 1;
            return acc;
          },
          {}
        );

        return counts[row.categoryId] ?? 0;
      },
    },*/

    {
      title: "Thao tác",
      render: (_, row) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.categoryId)}
            className="p-2 text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) return <div className="p-4">Đang tải...</div>;
  if (isError) return <div className="p-4 text-red-500">Lỗi tải dữ liệu</div>;

  return (
    <div className="max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Danh Mục Sản Phẩm</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Thêm danh mục
        </button>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm danh mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            <option value="name-asc">Tên A-Z</option>
            <option value="name-desc">Tên Z-A</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow p-4">
        <p className="mb-3 text-sm text-gray-600">
          Hiển thị {filteredCategories.length} danh mục
        </p>

        <Table columns={columns} data={filteredCategories} />
      </div>

      {/* MODAL */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={selectedCategory}
      />
    </div>
  );
};

export default Danhmuc;
