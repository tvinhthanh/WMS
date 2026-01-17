// services/user.service.ts
import { UserDTO } from "../types";
import api from "./api-client";

export const userService = {
  getAll: () => api.get<UserDTO[]>("/User").then((r) => r.data),

  getById: (id: number) =>
    api.get<UserDTO>(`/User/${id}`).then((r) => r.data),

  create: (payload: UserDTO) =>
    api.post<UserDTO>("/User", payload).then((r) => r.data),

  update: (id: number, payload: UserDTO) =>
    api.put<UserDTO>(`/User/${id}`, payload).then((r) => r.data),

  delete: (id: number) => api.delete(`/User/${id}`).then((r) => r.data),

  changePassword: (payload: {
    userId: number;
    currentPassword: string;
    newPassword: string;
  }) => api.post("/User/change-password", payload).then((r) => r.data),

  resetPassword: (id: number) =>
    api.post(`/User/reset-password/${id}`).then((r) => r.data),
};
