import { get, post, put, del } from "./api-client";
import { PurchaseOrderDTO, PurchaseOrderCreateDTO, PurchaseOrderUpdateDTO } from "../types";

export const purchaseOrderApi = {
    getAll: () => get<PurchaseOrderDTO[]>("/PurchaseOrder"),
    getById: (id: number) => get<PurchaseOrderDTO>(`/PurchaseOrder/${id}`),
    create: (payload: PurchaseOrderCreateDTO) =>
        post<PurchaseOrderDTO>("/PurchaseOrder", payload),
    update: (id: number, payload: PurchaseOrderUpdateDTO) =>
        put(`/PurchaseOrder/${id}`, payload),
    delete: (id: number) => del(`/PurchaseOrder/${id}`)
};
