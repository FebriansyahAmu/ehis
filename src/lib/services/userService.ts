// userService — provisioning akun (auth). Tak import prisma langsung (pakai `transaction` + DAL).
// Password di-hash di sini (boundary). Identitas = master.Pegawai (single source) → namaTampil
// diambil via pegawaiDal (Service boleh orkestrasi lintas-domain; DAL tetap per-schema).
// CATATAN: login/JWT/sesi BELUM dibangun — ini hanya tulis akun + peran.

import { transaction } from "@/lib/db/prisma";
import * as defaultUserDal from "@/lib/dal/userDal";
import * as defaultPegawaiDal from "@/lib/dal/pegawaiDal";
import { hashPassword } from "@/lib/crypto/password";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  CreateUserInput, AssignRolesInput, ListUsersQuery, UserDTO, UserListItemDTO,
} from "@/lib/schemas/user";
import type { UserEntity, UserListEntity } from "@/lib/dal/userDal";

type UserDal = typeof defaultUserDal;
type PegawaiDal = typeof defaultPegawaiDal;
type NonNullUser = NonNullable<UserEntity>;

export function makeUserService(deps: { dal?: UserDal; pegawaiDal?: PegawaiDal } = {}) {
  const dal = deps.dal ?? defaultUserDal;
  const pegawaiDal = deps.pegawaiDal ?? defaultPegawaiDal;

  function namaTampil(p: { gelarDepan: string | null; namaLengkap: string; gelarBelakang: string | null }): string {
    const depan = p.gelarDepan ? `${p.gelarDepan} ` : "";
    const belakang = p.gelarBelakang ? `, ${p.gelarBelakang}` : "";
    return `${depan}${p.namaLengkap}${belakang}`;
  }

  const DOKTER_PROFESI = new Set(["Dokter", "Dokter Gigi", "Dokter Spesialis"]);
  function isDokter(p: { practitionerId: string | null; profesi: string | null }): boolean {
    return p.practitionerId !== null || (p.profesi !== null && DOKTER_PROFESI.has(p.profesi));
  }

  function toListDTO(u: UserListEntity): UserListItemDTO {
    return {
      id: u.id,
      username: u.username,
      pegawaiId: u.pegawaiId,
      namaTampil: namaTampil(u.pegawai),
      email: u.pegawai.email,
      nip: u.pegawai.nip,
      roles: u.roles.map((r) => r.role.key),
      status: u.status,
      mustChangePassword: u.mustChangePassword,
      isDokter: isDokter(u.pegawai),
      lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
      createdAt: u.createdAt.toISOString(),
    };
  }

  function toDTO(u: NonNullUser, namaTampilPegawai: string): UserDTO {
    return {
      id: u.id,
      username: u.username,
      status: u.status,
      mustChangePassword: u.mustChangePassword,
      pegawaiId: u.pegawaiId,
      namaTampil: namaTampilPegawai,
      roles: u.roles.map((r) => r.role.key),
      createdAt: u.createdAt.toISOString(),
    };
  }

  /** Pegawai wajib ada (zero orphan account) + ambil identitas untuk DTO. */
  async function requirePegawai(pegawaiId: string) {
    const peg = await pegawaiDal.findById(pegawaiId);
    if (!peg) throw Errors.notFound("Pegawai tidak ditemukan");
    return peg;
  }

  /** Buat akun login tertaut 1 pegawai. Username unik (citext). Roles kosong (di-set terpisah). */
  async function createUser(input: CreateUserInput, _actor: Actor): Promise<UserDTO> {
    const peg = await requirePegawai(input.pegawaiId);
    if (await dal.findByPegawaiId(input.pegawaiId)) {
      throw Errors.conflict("Pegawai ini sudah memiliki akun login");
    }
    if (await dal.findByUsername(input.username)) {
      throw Errors.conflict(`Username "${input.username}" sudah dipakai`);
    }

    const created = await dal.create({
      pegawaiId: input.pegawaiId,
      username: input.username,
      passwordHash: hashPassword(input.password),
      mustChangePassword: input.mustChangePassword,
    });
    return toDTO(created, namaTampil(peg));
  }

  /** Tetapkan peran (replace) + status. Key role tak dikenal → VALIDATION. */
  async function assignRoles(userId: string, input: AssignRolesInput, _actor: Actor): Promise<UserDTO> {
    const user = await dal.findById(userId);
    if (!user) throw Errors.notFound("Akun tidak ditemukan");

    const wanted = [...new Set(input.roles)];
    const found = await dal.findRolesByKeys(wanted);
    if (found.length !== wanted.length) {
      const known = new Set(found.map((r) => r.key));
      const missing = wanted.filter((k) => !known.has(k));
      throw Errors.validation(`Peran tidak dikenal: ${missing.join(", ")}`);
    }

    const fresh = await transaction(async (tx) => {
      await dal.replaceRoles(userId, found.map((r) => r.id), tx);
      if (input.status) await dal.updateStatus(userId, input.status, tx);
      const u = await dal.findById(userId, tx);
      if (!u) throw Errors.notFound("Akun tidak ditemukan");
      return u;
    });

    const peg = await pegawaiDal.findById(fresh.pegawaiId);
    return toDTO(fresh, peg ? namaTampil(peg) : "—");
  }

  /** List akun untuk tabel Pengguna (cursor pagination). */
  async function listUsers(query: ListUsersQuery): Promise<{ items: UserListItemDTO[]; cursor: string | null }> {
    const { items, nextCursor } = await dal.list({ q: query.q, cursor: query.cursor, limit: query.limit });
    return { items: items.map(toListDTO), cursor: nextCursor };
  }

  return { createUser, assignRoles, listUsers };
}

export const userService = makeUserService();
