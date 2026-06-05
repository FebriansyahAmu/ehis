// Zod schema + DTO User/akun (auth, sisi PROVISIONING saja — login/JWT belum dibangun).
// Vocab status = enum Prisma auth.UserStatus (Active/Suspended/Locked). Frontend memetakan
// Aktif/Suspended/Non_Aktif → enum ini di API client (lihat src/lib/api/users.ts).

import { z } from "zod";

export const UserStatus = z.enum(["Active", "Suspended", "Locked"]);

const Username = z
  .string()
  .trim()
  .min(3, "Username minimal 3 karakter")
  .max(60)
  .regex(/^[a-z0-9.]+$/, "Hanya huruf kecil, angka, titik");

const Password = z.string().min(8, "Password minimal 8 karakter").max(200);
const PegawaiId = z.string().uuid("pegawaiId tidak valid");

// ── Create akun (POST /auth/users) — tertaut 1 pegawai (zero orphan account). Roles kosong;
//    di-set di langkah assignRoles. ──
export const CreateUserInput = z.object({
  pegawaiId: PegawaiId,
  username: Username,
  password: Password,
  mustChangePassword: z.boolean().default(true),
});

// ── Assign peran + status (PATCH /auth/users/:id/roles) — roles = KEY role (mis. "Dokter"). ──
export const AssignRolesInput = z.object({
  roles: z.array(z.string().trim().min(1)).min(1, "Pilih minimal 1 peran").max(9),
  status: UserStatus.optional(),
});

export const UserIdParam = z.object({ id: z.string().uuid("ID tidak valid") });

// ── List akun (GET /auth/users) ───────────────────────────────────────────────
export const ListUsersQuery = z.object({
  q: z.string().trim().min(1).max(120).optional(), // username / nama / NIP
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type ListUsersQuery = z.infer<typeof ListUsersQuery>;

export type CreateUserInput = z.infer<typeof CreateUserInput>;
export type AssignRolesInput = z.infer<typeof AssignRolesInput>;
export type UserStatusValue = z.infer<typeof UserStatus>;

// ── DTO (tak pernah bocorkan passwordHash/tokenVersion) ────────────────────────
export interface UserDTO {
  id: string;
  username: string;
  status: UserStatusValue;
  mustChangePassword: boolean;
  pegawaiId: string;
  /** namaTampil pegawai tertaut (display) — diisi Service via master.Pegawai. */
  namaTampil: string;
  roles: string[]; // key role (mis. ["Dokter","SpPK"])
  createdAt: string;
}

/** Item ringkas untuk tabel Pengguna — gabung identitas pegawai (display). */
export interface UserListItemDTO {
  id: string;
  username: string;
  pegawaiId: string;
  namaTampil: string;
  email: string | null;
  nip: string;
  roles: string[];
  status: UserStatusValue;
  mustChangePassword: boolean;
  isDokter: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}
