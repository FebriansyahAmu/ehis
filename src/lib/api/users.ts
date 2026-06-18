// API auth/users (browser) — sisi PROVISIONING (login belum dibangun). Tipe DI-REUSE dari
// schema server. Status frontend (Aktif/Suspended/Non_Aktif) dipetakan ke enum server
// (Active/Suspended/Locked) di sini → kontrak server tetap "bahasa" enum-nya sendiri.

import { api } from "@/lib/api/client";
import type {
  CreateUserInput, AssignRolesInput, UpdateUserInput, UserDTO, UserListItemDTO, UserStatusValue,
} from "@/lib/schemas/user";
import {
  unitKerjaToKodes,
  type AkunData, type PenggunaRecord, type UserRole, type UserStatus,
} from "@/components/master/pengguna/penggunaShared";

export type { UserDTO, UserListItemDTO };

// Non_Aktif → Locked: enum server belum punya nilai "Disabled" khusus (tech debt — refine saat
// modul auth runtime dibangun). Keduanya = tak bisa login.
const STATUS_TO_SERVER: Record<UserStatus, UserStatusValue> = {
  Aktif: "Active",
  Suspended: "Suspended",
  Non_Aktif: "Locked",
};

const STATUS_FROM_SERVER: Record<UserStatusValue, UserStatus> = {
  Active: "Aktif",
  Suspended: "Suspended",
  Locked: "Non_Aktif",
};

/** POST /auth/users — buat akun tertaut pegawai (Step 2 wizard). */
export async function createUser(pegawaiId: string, akun: AkunData, signal?: AbortSignal): Promise<UserDTO> {
  const input: CreateUserInput = {
    pegawaiId,
    username: akun.username.trim(),
    password: akun.password,
    mustChangePassword: akun.mustChangePassword,
  };
  const { data } = await api.post<UserDTO>("/auth/users", input, { signal });
  return data;
}

/** UserListItemDTO (server) → PenggunaRecord (tabel). Kolom Unit = unit kerja pegawai (master.Pegawai)
 *  dipetakan nama→kode; per-user care-unit scope (UserUnitScope) belum ada → ini sumber Unit saat ini. */
export function userDtoToRecord(u: UserListItemDTO): PenggunaRecord {
  return {
    id: u.id,
    pegawaiId: u.pegawaiId,
    username: u.username,
    nama: u.namaTampil,
    email: u.email ?? "",
    roles: u.roles as UserRole[],
    unitAssignment: unitKerjaToKodes(u.unitKerja),
    status: STATUS_FROM_SERVER[u.status],
    mustChangePassword: u.mustChangePassword,
    lastLogin: u.lastLoginAt,
    createdAt: u.createdAt,
    dokterId: u.isDokter ? `dr-${u.pegawaiId}` : undefined,
  };
}

export interface ListUsersParams {
  q?: string;
  cursor?: string;
  limit?: number;
}

/** GET /auth/users — list akun (sudah dipetakan ke PenggunaRecord). */
export async function listUsers(
  params: ListUsersParams = {},
  signal?: AbortSignal,
): Promise<{ items: PenggunaRecord[]; cursor: string | null }> {
  const { data, meta } = await api.get<UserListItemDTO[]>("/auth/users", { query: { ...params }, signal });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data.map(userDtoToRecord), cursor };
}

/** PATCH /auth/users/:id — ubah username dan/atau reset password (Edit akun). */
export async function updateUser(
  userId: string,
  changes: { username?: string; password?: string },
  signal?: AbortSignal,
): Promise<UserDTO> {
  const input: UpdateUserInput = {};
  if (changes.username !== undefined) input.username = changes.username;
  if (changes.password) input.password = changes.password;
  const { data } = await api.patch<UserDTO>(
    `/auth/users/${encodeURIComponent(userId)}`,
    input,
    { signal },
  );
  return data;
}

/** PATCH /auth/users/:id/roles — tetapkan peran + status (Step 3 wizard). */
export async function assignRoles(
  userId: string,
  roles: UserRole[],
  status: UserStatus,
  signal?: AbortSignal,
): Promise<UserDTO> {
  const input: AssignRolesInput = { roles, status: STATUS_TO_SERVER[status] };
  const { data } = await api.patch<UserDTO>(
    `/auth/users/${encodeURIComponent(userId)}/roles`,
    input,
    { signal },
  );
  return data;
}
