import api from "./api-client";
import { ReceivingDTO, ReceivingCreateDTO, ReceivingReportDTO } from "../types";
import { extractDataFromResponse } from "../utils/pagination";

type PaginatedReceivingResponse = {
    data: ReceivingDTO[];
    pagination: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
    };
};

export const receivingService = {
    getAll: async (page?: number, pageSize?: number): Promise<ReceivingDTO[] | PaginatedReceivingResponse> => {
        if (page !== undefined && pageSize !== undefined) {
            const params = new URLSearchParams();
            params.append("page", page.toString());
            params.append("pageSize", pageSize.toString());
            const response = await api.get<PaginatedReceivingResponse>(`/Receiving?${params.toString()}`);
            return response.data;
        } else {
            // Backward compatible: không có pagination params thì gọi như cũ
            const response = await api.get<PaginatedReceivingResponse | ReceivingDTO[]>(`/Receiving`);
            return extractDataFromResponse(response.data) as ReceivingDTO[];
        }
    },

    getById: (id: number) =>
        api.get<ReceivingDTO>(`/Receiving/${id}`).then((r) => r.data),

    create: (payload: ReceivingCreateDTO) =>
        api.post(`/Receiving`, payload).then((r) => r.data),

    updateActual: (payload: any) =>
        api.post(`/Receiving/update-actual`, payload).then((r) => r.data),

    getReport: (fromDate?: string, toDate?: string) => {
        const params = new URLSearchParams();
        if (fromDate) params.append("fromDate", fromDate);
        if (toDate) params.append("toDate", toDate);
        const query = params.toString();
        return api.get<ReceivingReportDTO[]>(`/Receiving/report${query ? `?${query}` : ""}`).then((r) => r.data);
    },

    cancel: (id: number) =>
        api.put(`/Receiving/${id}/cancel`, {}).then((r) => r.data),

    updateDeliveryCode: (id: number, deliveryCode: string | null) =>
        api.put(`/Receiving/${id}/delivery-code`, { deliveryCode }).then((r) => r.data),
};
