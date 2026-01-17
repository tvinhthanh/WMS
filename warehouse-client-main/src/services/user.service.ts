import { UserDTO, PasswordResetRequestDTO } from "../types";
import api from "./api-client";

export const userService = {
  getAll: () => api.get<UserDTO[]>("/User").then((r) => r.data),

  getById: (id: number) =>
    api.get<UserDTO>(`/User/${id}`).then((r) => r.data),

  create: (payload: UserDTO) =>
    api.post<UserDTO>("/User", payload).then((r) => r.data),

  update: (id: number, payload: UserDTO) =>
    api.put<UserDTO>(`/User/${id}`, payload).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/User/${id}`).then((r) => r.data),

  // CHANGE PASSWORD (JWT user)
  changePassword: (payload: {
    Password: string;
    NewPassword: string;
    ConfirmPassword: string;
  }) =>
    api.post("/Auth/password/change", payload).then((r) => r.data),

  resetPassword: (id: number) =>
    api.post<string>(`/User/reset-password/${id}`).then((r) => r.data),

  // Password Reset Requests
  requestPasswordReset: (loginInfo: string) =>
    api.post<{ message: string; requestId: number }>("/Auth/request-password-reset", { loginInfo }).then((r) => r.data),

  getPasswordResetRequests: (status?: string) => {
    const params = status ? `?status=${status}` : "";
    return api.get<PasswordResetRequestDTO[]>(`/User/password-reset-requests${params}`).then((r) => r.data);
  },

  processPasswordResetRequest: (requestId: number, action: "approve" | "reject", notes?: string) =>
    api.post<{ message: string; userId?: number; employeeCode?: string; fullName?: string }>(
      `/User/password-reset-requests/${requestId}/process`,
      { action, notes }
    ).then((r) => r.data),
};
