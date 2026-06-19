// vendorService — Inventory Rekanan. CRUD + map entity→DTO (FE Vendor). `list` ACTOR-LESS (SSR-safe).
// Kode auto `VND-<NNN>` (counter global) dalam transaksi create. Pola identik bmhpService.

import * as defaultDal from "@/lib/dal/inventory/vendorDal";
import { transaction } from "@/lib/db/prisma";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  VendorData, VendorPatch, VendorEntity, VendorJenisDal, VendorStatusDal,
} from "@/lib/dal/inventory/vendorDal";
import type {
  CreateVendorInput, UpdateVendorInput, VendorQuery, VendorDTO,
} from "@/lib/schemas/inventory/vendor";

type Dal = typeof defaultDal;
const DEFAULT_LIMIT = 100;
const nu = <T>(v: T | null): T | undefined => (v === null ? undefined : v);

function toDTO(e: VendorEntity): VendorDTO {
  return {
    id: e.id,
    kode: e.kode,
    nama: e.nama,
    jenis: e.jenis as VendorDTO["jenis"],
    izinPbf: nu(e.izinPbf),
    kontakNama: e.kontakNama,
    telp: e.telp,
    email: nu(e.email),
    alamat: e.alamat,
    leadTimeHari: e.leadTimeHari,
    status: e.status as VendorDTO["status"],
  };
}

export function makeVendorService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function list(query: VendorQuery): Promise<{ items: VendorDTO[]; cursor: string | null }> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    const status = query.status && query.status !== "Semua" ? query.status : undefined;
    const rows = await dal.list({ q: query.q || undefined, jenis: query.jenis, status, cursorId: query.cursor, limit: limit + 1 });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return { items: page.map(toDTO), cursor: hasMore ? page[page.length - 1].id : null };
  }

  async function create(input: CreateVendorInput, _actor: Actor): Promise<VendorDTO> {
    const row = await transaction(async (tx) => {
      const seq = await dal.nextVendorSeq(tx);
      const data: VendorData = {
        kode: `VND-${String(seq).padStart(3, "0")}`,
        nama: input.nama,
        jenis: input.jenis as VendorJenisDal,
        izinPbf: input.izinPbf ?? null,
        kontakNama: input.kontakNama,
        telp: input.telp,
        email: input.email ?? null,
        alamat: input.alamat,
        leadTimeHari: input.leadTimeHari ?? 0,
        status: (input.status ?? "Aktif") as VendorStatusDal,
      };
      return dal.create(data, tx);
    });
    return toDTO(row);
  }

  async function update(id: string, input: UpdateVendorInput, _actor: Actor): Promise<VendorDTO> {
    const existing = await dal.findById(id);
    if (!existing) throw Errors.notFound("Rekanan tidak ditemukan");
    const p: VendorPatch = {};
    if (input.nama !== undefined) p.nama = input.nama;
    if (input.jenis !== undefined) p.jenis = input.jenis as VendorJenisDal;
    if (input.izinPbf !== undefined) p.izinPbf = input.izinPbf ?? null;
    if (input.kontakNama !== undefined) p.kontakNama = input.kontakNama;
    if (input.telp !== undefined) p.telp = input.telp;
    if (input.email !== undefined) p.email = input.email ?? null;
    if (input.alamat !== undefined) p.alamat = input.alamat;
    if (input.leadTimeHari !== undefined) p.leadTimeHari = input.leadTimeHari;
    if (input.status !== undefined) p.status = input.status as VendorStatusDal;
    const row = await dal.update(id, p);
    return toDTO(row);
  }

  async function remove(id: string, _actor: Actor): Promise<void> {
    const count = await dal.softDelete(id);
    if (count === 0) throw Errors.notFound("Rekanan tidak ditemukan");
  }

  return { list, create, update, remove };
}

export const vendorService = makeVendorService();
