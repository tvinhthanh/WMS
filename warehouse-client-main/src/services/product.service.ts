import { ProductCreateDTO, ProductDTO, ProductUpdateDTO } from "../types";
import api from "./api-client";
import { extractDataFromResponse } from "../utils/pagination";

type PaginatedProductResponse = {
    data: ProductDTO[];
    pagination: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
    };
};

export const productService = {
  getAll: async (page?: number, pageSize?: number): Promise<ProductDTO[] | PaginatedProductResponse> => {
    if (page !== undefined && pageSize !== undefined) {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("pageSize", pageSize.toString());
      const response = await api.get<PaginatedProductResponse>(`/Product?${params.toString()}`);
      return response.data;
    } else {
      // Backward compatible: không có pagination params thì gọi như cũ
      const response = await api.get<PaginatedProductResponse | ProductDTO[]>(`/Product`);
      return extractDataFromResponse(response.data) as ProductDTO[];
    }
  },

  getById: (id: number) =>
    api.get<ProductDTO>(`/Product/${id}`).then((r) => r.data),

  getByPartner: (partnerId: number) =>
    api.get<ProductDTO[]>(`/Product/by-partner/${partnerId}`).then((r) => r.data),

  create: (payload: ProductCreateDTO) =>
    api.post<ProductDTO>("/Product", payload).then((r) => r.data),

  update: (id: number, payload: ProductUpdateDTO) =>
    api.put(`/Product/${id}`, payload).then((r) => r.data),

  delete: async (id: number) => {
  try {
    await api.delete(`/Product/${id}`);
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data ||
      "Không thể xóa sản phẩm";

    throw new Error(message);
  }
},


  // Series management
  getSeries: (productId: number) =>
    api.get(`/Product/${productId}/series`).then((r) => r.data),

  addSeries: (productId: number, payload: { serialNumber: string; status?: string; notes?: string }) =>
    api.post(`/Product/${productId}/series`, payload).then((r) => r.data),

  addSeriesBulk: (productId: number, payload: { serialNumbers: string[]; notes?: string }) =>
    api.post(`/Product/${productId}/series/bulk`, payload).then((r) => r.data),

  updateSeries: (seriesId: number, payload: { serialNumber?: string; status?: string; notes?: string }) =>
    api.put(`/Product/series/${seriesId}`, payload).then((r) => r.data),

  deleteSeries: (seriesId: number) =>
    api.delete(`/Product/series/${seriesId}`).then((r) => r.data),

  searchSeries: (serialNumber: string) =>
    api.get(`/Product/series/search/${serialNumber}`).then((r) => r.data),

  // Partner management
  getPartners: (productId: number) =>
    api.get(`/Product/${productId}/partners`).then((r) => r.data),

  addPartner: (productId: number, payload: { partnerId: number; defaultPrice?: number; partnerProductCode?: string }) =>
    api.post(`/Product/${productId}/partners`, payload).then((r) => r.data),

  updatePartner: (partnerRelationId: number, payload: { defaultPrice?: number; partnerProductCode?: string }) =>
    api.put(`/Product/partners/${partnerRelationId}`, payload).then((r) => r.data),

  deletePartner: (partnerRelationId: number) =>
    api.delete(`/Product/partners/${partnerRelationId}`).then((r) => r.data),
};
