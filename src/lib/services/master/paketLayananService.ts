// paketLayananService — Master Paket Layanan (katalog bundel). Business rule + map entity→DTO.
// Kode `PKT-NNNN` AUTO-GEN (counter atomik, dalam transaksi). items = JSONB [{nama,qty}] (replace utuh).
// Katalog leaf (tanpa optimistic-version). RBAC `master.katalog` di Route (CRUD); konsumen `listTersedia`
// gate `registration.kunjungan:read`. ABAC tak relevan (data global RS). Pola identik sdkiService.

import * as defaultDal from "@/lib/dal/master/paketLayananDal";
import { transaction } from "@/lib/db/prisma";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { PaketEntity, PaketData, PaketPatch } from "@/lib/dal/master/paketLayananDal";
import type {
  CreatePaketInput, UpdatePaketInput, PaketQuery, PaketDTO, PaketItemDTO,
} from "@/lib/schemas/master/paketLayanan";

type Dal = typeof defaultDal;

const DEFAULT_LIMIT = 200;

// JSONB → item DTO (defensif: bentuk bisa apa saja dari kolom Json).
function toItems(v: unknown): PaketItemDTO[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((x) => {
    const o = (x ?? {}) as Record<string, unknown>;
    const nama = typeof o.nama === "string" ? o.nama.trim() : "";
    if (!nama) return [];
    const qty = typeof o.qty === "number" && o.qty > 0 ? Math.floor(o.qty) : 1;
    return [{ nama, qty }];
  });
}

function toDTO(e: PaketEntity): PaketDTO {
  return {
    id: e.id,
    kode: e.kode,
    nama: e.nama,
    kategori: e.kategori,
    deskripsi: e.deskripsi,
    items: toItems(e.items),
    hargaUmum: e.hargaUmum,
    hargaBpjs: e.hargaBpjs,
    diskonPct: e.diskonPct,
    badge: e.badge,
    status: e.status,
  };
}

// set hanya bila terdefinisi (patch parsial; allow-list anti mass-assign).
function setDefined<T extends object, K extends keyof T>(t: T, k: K, v: T[K] | undefined) {
  if (v !== undefined) t[k] = v;
}

export function makePaketLayananService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  /** Kode paket `PKT-NNNN` (pad min 4 digit; bila >9999 lebar tumbuh). */
  function formatKode(seq: number): string {
    return `PKT-${String(seq).padStart(4, "0")}`;
  }

  /** List + filter (q/kategori/status) + keyset cursor. ACTOR-LESS (SSR-safe). */
  async function list(query: PaketQuery): Promise<{ items: PaketDTO[]; cursor: string | null }> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    const status = query.status && query.status !== "Semua" ? query.status : undefined;

    const rows = await dal.list({
      q: query.q || undefined,
      kategori: query.kategori,
      status,
      cursorId: query.cursor,
      limit: limit + 1, // +1 → deteksi halaman berikutnya
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return { items: page.map(toDTO), cursor: hasMore ? page[page.length - 1].id : null };
  }

  /** Katalog paket AKTIF utk KONSUMEN (registrasi → Ubah Paket → Paket Layanan). ACTOR-LESS. */
  async function listTersedia(): Promise<PaketDTO[]> {
    const { items } = await list({ status: "Aktif", limit: 300 } as PaketQuery);
    return items;
  }

  /** Tambah 1 paket. Kode auto `PKT-NNNN` (counter atomik) dalam 1 transaksi. */
  async function create(input: CreatePaketInput, _actor: Actor): Promise<PaketDTO> {
    const row = await transaction(async (tx) => {
      const seq = await dal.nextPaketSeq(tx);
      const data: PaketData = {
        kode: formatKode(seq),
        nama: input.nama,
        kategori: input.kategori ?? "Lainnya",
        deskripsi: input.deskripsi ?? "",
        items: input.items ?? [],
        hargaUmum: input.hargaUmum,
        hargaBpjs: input.hargaBpjs ?? null,
        diskonPct: input.diskonPct ?? null,
        badge: input.badge ?? null,
        status: input.status ?? "Aktif",
      };
      return dal.create(data, tx);
    });
    return toDTO(row);
  }

  /** Ubah 1 paket (parsial). Kode immutable (auto-gen). items = replace utuh bila dikirim. */
  async function update(id: string, input: UpdatePaketInput, _actor: Actor): Promise<PaketDTO> {
    const existing = await dal.findById(id);
    if (!existing) throw Errors.notFound("Paket layanan tidak ditemukan");

    const patch: PaketPatch = {};
    setDefined(patch, "nama", input.nama);
    setDefined(patch, "kategori", input.kategori);
    setDefined(patch, "deskripsi", input.deskripsi);
    if (input.items !== undefined) patch.items = input.items;
    setDefined(patch, "hargaUmum", input.hargaUmum);
    if (input.hargaBpjs !== undefined) patch.hargaBpjs = input.hargaBpjs;
    if (input.diskonPct !== undefined) patch.diskonPct = input.diskonPct;
    if (input.badge !== undefined) patch.badge = input.badge;
    setDefined(patch, "status", input.status);

    const row = await dal.update(id, patch);
    return toDTO(row);
  }

  /** Soft-delete 1 paket. */
  async function remove(id: string, _actor: Actor): Promise<void> {
    const count = await dal.softDelete(id);
    if (count === 0) throw Errors.notFound("Paket layanan tidak ditemukan");
  }

  return { list, listTersedia, create, update, remove };
}

export const paketLayananService = makePaketLayananService();
