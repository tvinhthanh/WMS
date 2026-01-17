import {
    ProductCategoryDTO,
    ProductCategoryCreateDTO,
    ProductCategoryUpdateDTO
} from "../types";
import api from "./api-client";

export const categoryService = {
    getAll: () =>
        api.get<ProductCategoryDTO[]>("/Category").then(r => r.data),

    create: (payload: ProductCategoryCreateDTO) =>
        api.post<ProductCategoryDTO>("/Category", payload).then(r => r.data),

    update: (id: number, payload: ProductCategoryUpdateDTO) =>
        api.put<ProductCategoryDTO>(`/Category/${id}`, payload).then(r => r.data),

    delete: async (id: number) => {
  try {
    await api.delete(`/Category/${id}`);
   } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data ||
      "Không thể xóa danh mục";

    throw new Error(message);
        }
    },

};
