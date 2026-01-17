import { get, post, put, del } from "./api-client";
import {
    PickingAddItemDTO,
    PickingCreateDTO,
    PickingOrderDTO
} from "../types";
import { extractDataFromResponse } from "../utils/pagination";

type PaginatedPickingResponse = {
    data: PickingOrderDTO[];
    pagination: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
    };
};

export const pickingService = {
    /** Lấy toàn bộ Picking Orders với pagination */
    getAll: async (page?: number, pageSize?: number): Promise<PickingOrderDTO[] | PaginatedPickingResponse> => {
        if (page !== undefined && pageSize !== undefined) {
            const params = new URLSearchParams();
            params.append("page", page.toString());
            params.append("pageSize", pageSize.toString());
            return await get<PaginatedPickingResponse>(`/Picking?${params.toString()}`);
        } else {
            // Backward compatible: không có pagination params thì gọi như cũ
            const response = await get<PaginatedPickingResponse | PickingOrderDTO[]>(`/Picking`);
            // Nếu response có structure mới (có data property), extract data
            return extractDataFromResponse(response) as PickingOrderDTO[];
        }
    },

    /** Tạo Picking Order rỗng */
    createOrder: (payload: PickingCreateDTO) =>
        post<PickingOrderDTO>("/Picking/create", payload),

    /** Thêm sản phẩm vào order */
    addItem: (payload: PickingAddItemDTO) =>
        post<any>("/Picking/add-item", payload),

    /** Cập nhật số lượng sản phẩm */
    updateDetail: (detailId: number, quantity: number) =>
        put<any>(`/Picking/update-detail/${detailId}`, { quantityPicked: quantity }),

    /** Xóa sản phẩm khỏi order */
    deleteDetail: (detailId: number) =>
        del<any>(`/Picking/detail/${detailId}`),

    /** Hoàn thành đơn xuất */
    complete: (id: number) =>
        post<any>(`/Picking/complete/${id}`),

    /** Hủy phiếu xuất */
    cancel: (id: number) =>
        put<any>(`/Picking/${id}/cancel`),

    getById: (id: number) => get<PickingOrderDTO>(`/Picking/${id}`),
};