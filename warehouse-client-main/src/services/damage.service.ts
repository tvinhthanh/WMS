import { get } from "./api-client";
import { PendingDamageSummaryDTO } from "../types";

export const damageService = {
    getPending: () => get<PendingDamageSummaryDTO[]>("/Damage/pending"),
};

