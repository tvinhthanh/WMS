import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "react-query";
import { X } from "lucide-react";
import { ProductCategoryDTO } from "../../../types";
import { categoryService } from "../../../services/category.service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  category?: ProductCategoryDTO | null;
}

const CategoryModal = ({ isOpen, onClose, category }: Props) => {
  const [categoryName, setCategoryName] = useState("");
  const queryClient = useQueryClient();

  const isEdit = !!category;

  // Load data khi mở modal
  useEffect(() => {
    setCategoryName(category?.categoryName || "");
  }, [category]);

  // CREATE
  const createMutation = useMutation(
    (payload: { categoryName: string }) => categoryService.create(payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("categories");
        onClose();
      },
    }
  );

  // UPDATE
  const updateMutation = useMutation(
    (payload: { id: number; categoryName: string }) =>
      categoryService.update(payload.id, { categoryName: payload.categoryName }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("categories");
        onClose();
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = categoryName.trim();
    if (!name) return;

    if (isEdit && category) {
      updateMutation.mutate({
        id: category.categoryId,
        categoryName: name,
      });
    } else {
      createMutation.mutate({ categoryName: name });
    }
  };

  if (!isOpen) return null;

  const loading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {isEdit ? "Sửa danh mục" : "Thêm danh mục"}
          </h2>

          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium mb-1">
            Tên danh mục
          </label>

          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 mb-4"
            placeholder="Nhập tên danh mục"
            required
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100"
              disabled={loading}
            >
              Hủy
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
              disabled={loading}
            >
              {loading
                ? "Đang xử lý..."
                : isEdit
                  ? "Cập nhật"
                  : "Thêm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
