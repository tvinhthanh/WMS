/* eslint-disable @typescript-eslint/no-explicit-any */
import { get } from "./api-client";

export const loginService = {
  getUserHistory: async (userId: number) => {
    return get<any[]>(`/user/users/${userId}/login-history`);
  }
};

export default loginService;
