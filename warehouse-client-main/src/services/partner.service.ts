import { PartnerDTO, PartnerCreateDTO, PartnerUpdateDTO } from "../types";
import api from "./api-client";

export const partnerService = {
  getAll: () => api.get<PartnerDTO[]>("/Partners").then((r) => r.data),

  getById: (id: number) =>
    api.get<PartnerDTO>(`/Partners/${id}`).then((r) => r.data),

  create: (payload: PartnerCreateDTO) =>
    api.post<PartnerDTO>("/Partners", payload).then((r) => r.data),

  update: (id: number, payload: PartnerUpdateDTO) =>
    api.put(`/Partners/${id}`, payload).then((r) => r.data),

  delete: async (id: number) => {
    try {
      await api.delete(`/Partners/${id}`);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        "Không thể xóa đối tác";

      throw new Error(message);
    }
  },
};
