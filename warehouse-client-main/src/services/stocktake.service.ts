import { get, post, del } from "./api-client";
import { StockTakeDTO, StockTakeCreateDTO, StockTakeReviewDTO } from "../types";

export const stockTakeService = {
    getAll: () => get<StockTakeDTO[]>("/StockTake"),

    getById: (id: number) => get<StockTakeDTO>(`/StockTake/${id}`),

    create: (payload: StockTakeCreateDTO) =>
        post<any>("/StockTake", payload),

    submit: (id: number) =>
        post<any>(`/StockTake/submit/${id}`),

    review: (id: number, payload?: StockTakeReviewDTO) =>
        post<any>(`/StockTake/review/${id}`, payload || {}),

    complete: (id: number) =>
        post<any>(`/StockTake/complete/${id}`),

    delete: (id: number) =>
        del<any>(`/StockTake/${id}`),
};

