/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosRequestConfig } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://localhost:7215/api";

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

// Auto attach TOKEN JWT vào header mỗi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  return config;
});

// Handle errors chung
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = "Request failed";

    // Backend có thể trả về string trực tiếp hoặc object có message
    if (error.response?.data) {
      if (typeof error.response.data === "string") {
        message = error.response.data;
      } else if (error.response.data.message) {
      message = error.response.data.message;
      } else if (error.response.data.error) {
        message = error.response.data.error;
      } else {
        message = JSON.stringify(error.response.data);
      }
    } else if (error.response?.status) {
      message = `Error ${error.response.status}`;
    } else if (error.message) {
      message = error.message;
    }

    // Giữ lại error object gốc để có thể truy cập response.data
    const errorWithResponse = new Error(message) as any;
    errorWithResponse.response = error.response;
    errorWithResponse.originalError = error;

    return Promise.reject(errorWithResponse);
  }
);

// REQUEST WRAPPERS
export const get = async <T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> => {
  const res = await api.get(endpoint, config);
  return res.data;
};

export const post = async <T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  const res = await api.post(endpoint, data, config);
  return res.data;
};

export const put = async <T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  const res = await api.put(endpoint, data, config);
  return res.data;
};

export const patch = async <T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  const res = await api.patch(endpoint, data, config);
  return res.data;
};

export const del = async <T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> => {
  const res = await api.delete(endpoint, config);
  return res.data;
};

export default api;
