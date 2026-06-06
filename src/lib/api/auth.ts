// API auth runtime (browser): login / logout / sesi aktif. Envelope-aware via `api` client
// (cookie httpOnly ikut otomatis, same-origin). Tipe SessionDTO di-reuse dari schema server.

import { api } from "@/lib/api/client";
import type { SessionDTO } from "@/lib/schemas/auth";

export type { SessionDTO };

/** POST /auth/login — set cookie sesi + kembalikan sesi aktif. */
export async function login(username: string, password: string): Promise<SessionDTO> {
  const { data } = await api.post<SessionDTO>("/auth/login", { username, password });
  return data;
}

/** POST /auth/logout — cabut refresh device ini + hapus cookie. */
export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

/** GET /auth/me — sesi + permission efektif. 401 (ApiError) bila tak ada sesi. */
export async function fetchMe(signal?: AbortSignal): Promise<SessionDTO> {
  const { data } = await api.get<SessionDTO>("/auth/me", { signal });
  return data;
}
