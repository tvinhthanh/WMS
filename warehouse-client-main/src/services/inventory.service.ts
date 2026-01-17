import api from "./api-client";
import { InventoryDTO, InventoryDetailDTO, InventoryLogDTO, InventorySummaryDTO } from "../types";
import { extractDataFromResponse } from "../utils/pagination";

type PaginatedInventoryResponse = {
    data: InventoryDTO[];
    pagination: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
    };
};

export const inventoryService = {
  getAll: async (page?: number, pageSize?: number): Promise<InventoryDTO[] | PaginatedInventoryResponse> => {
    if (page !== undefined && pageSize !== undefined) {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("pageSize", pageSize.toString());
      const response = await api.get<PaginatedInventoryResponse>(`/Inventory?${params.toString()}`);
      return response.data;
    } else {
      // Backward compatible: không có pagination params thì gọi như cũ
      const response = await api.get<PaginatedInventoryResponse | InventoryDTO[]>(`/Inventory`);
      return extractDataFromResponse(response.data) as InventoryDTO[];
    }
  },

  getByProduct: (productId: number) =>
    api.get<InventoryDTO>(`/Inventory/${productId}`).then((r) => r.data),

  // NEW APIs for FIFO and Logs
  getDetails: (productId: number) =>
    api.get<InventoryDetailDTO[]>(`/Inventory/details/${productId}`).then((r) => r.data),

  getMovements: (params?: { productId?: number; from?: string; to?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.productId) queryParams.append("productId", params.productId.toString());
    if (params?.from) queryParams.append("from", params.from);
    if (params?.to) queryParams.append("to", params.to);
    const query = queryParams.toString();
    return api.get<InventoryLogDTO[]>(`/Inventory/movements${query ? `?${query}` : ""}`).then((r) => r.data);
  },

  getSummary: (params?: { productId?: number; date?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.productId) queryParams.append("productId", params.productId.toString());
    if (params?.date) queryParams.append("date", params.date);
    const query = queryParams.toString();
    return api.get<InventorySummaryDTO | InventorySummaryDTO[]>(`/Inventory/summary${query ? `?${query}` : ""}`).then((r) => r.data);
  },

  getReport: (fromDate?: string, toDate?: string) => {
    const queryParams = new URLSearchParams();
    if (fromDate) queryParams.append("fromDate", fromDate);
    if (toDate) queryParams.append("toDate", toDate);
    const query = queryParams.toString();
    return api.get<InventorySummaryDTO[]>(`/Inventory/report${query ? `?${query}` : ""}`).then((r) => r.data);
  },
};
