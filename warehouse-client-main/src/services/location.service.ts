// services/location.service.ts
import { get, post, put, del } from "./api-client";

export interface LocationData {
    locationId: number;
    locationName: string;
    description?: string;
}

export interface LocationCreate {
    locationName: string;
    description?: string;
}

export interface LocationUpdate {
    locationName?: string;
    description?: string;
}

export const locationApi = {
    getAll: () => get<LocationData[]>("/Location"),

    getById: (id: number) => get<LocationData>(`/Location/${id}`),

    create: (data: LocationCreate) => post<LocationData>("/Location", data),

    update: (id: number, data: LocationUpdate) =>
        put<LocationData>(`/Location/${id}`, data),

    delete: (id: number) => del(`/Location/${id}`),
};