// services/auth.service.ts
import { UserDTO, LoginHistoryDTO, RegisterPayload, AuthResponse, LoginPayload } from "../types";
import api from "./api-client";

export const authService = {
    register: (payload: RegisterPayload) =>
        api.post<AuthResponse>("/Auth/register", payload).then((r) => r.data),

    login: (payload: LoginPayload) =>
        api.post<AuthResponse>("/Auth/login", payload).then((r) => r.data),

    me: () => api.get<{ user: UserDTO }>("/Auth/me").then((r) => r.data),

    updateProfile: (payload: Partial<UserDTO>) =>
        api.put<{ user: UserDTO }>("/Auth/profile", payload).then((r) => r.data),

    changePassword: (payload: { currentPassword: string; newPassword: string }) =>
        api.post("/Auth/password/change", payload).then((r) => r.data),

   myLoginHistory: () =>
    api.get<{ logs: LoginHistoryDTO[] }>("/Auth/my-login-history").then((r) => r.data.logs),

    // Quên mật khẩu - Reset password
    resetPassword: (id: number) =>
        api.post<string>(`/Auth/reset-password/${id}`).then((r) => r.data),
};
