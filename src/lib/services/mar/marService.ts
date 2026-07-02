// marService — MAR (Medication Administration Record per shift, tab MAR RI, SNARS PKPO 6).
// Baris obat = derivasi ResepItem order non-batal kunjungan (bukan tabel sendiri); entri =
// append-only "latest wins" per (resepItemId × tanggal × shift) — koreksi INSERT baru, read
// reduksi createdAt terbaru. perawat = nama actor (user login, server otoritatif); obat HAM +
// status Diberikan WAJIB perawat2 (double-check 2 perawat — SKP 3) ditegakkan di sini.
// RBAC clinical.keperawatan di Route; ABAC careUnit di route() choke-point.

import * as defaultDal from "@/lib/dal/mar/marDal";
import * as resepDal from "@/lib/dal/resep/resepDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { MarEntryEntity } from "@/lib/dal/mar/marDal";
import {
  type MarEntryInput, type MarDTO, type MarObatDTO, type MarEntryDTO,
  type MarShift, type MarStatus,
} from "@/lib/schemas/mar/mar";

type Dal = typeof defaultDal;

/** Item resep hasil listByKunjungan (order non-batal). */
type ResepItemRow = Awaited<ReturnType<typeof resepDal.listByKunjungan>>[number]["items"][number];

function asShift(v: string): MarShift { return v === "Siang" || v === "Malam" ? v : "Pagi"; }

function asStatus(v: string): MarStatus {
  return v === "Ditunda" || v === "Ditolak" || v === "TidakTersedia" ? v : "Diberikan";
}

function toObatDTO(i: ResepItemRow): MarObatDTO {
  return {
    id: i.id,
    namaObat: i.namaObat,
    dosis: i.dosis ?? "",
    rute: i.rute ?? "",
    signa: i.signa ?? "",
    kategori: i.kategori,
    isHAM: i.isHAM,
    aktif: true, // order batal sudah tereksklusi
  };
}

function toEntryDTO(e: MarEntryEntity): MarEntryDTO {
  return {
    id: e.id,
    resepItemId: e.resepItemId,
    tanggal: e.tanggal,
    shift: asShift(e.shift),
    status: asStatus(e.status),
    waktuPemberian: e.waktuPemberian ?? undefined,
    perawat: e.perawat || undefined,
    perawat2: e.perawat2 || undefined,
    catatan: e.catatan || undefined,
  };
}

export function makeMarService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  /** Item ResepItem order NON-BATAL kunjungan (baris obat MAR). */
  async function listResepItems(kunjunganId: string): Promise<ResepItemRow[]> {
    const orders = await resepDal.listByKunjungan(kunjunganId);
    return orders.filter((o) => o.status !== "Dibatalkan").flatMap((o) => o.items);
  }

  /** Agregat: baris obat (derivasi resep) + entri latest-wins per slot. */
  async function get(kunjunganId: string, _actor: Actor): Promise<MarDTO> {
    await assertKunjungan(kunjunganId);
    const [items, rows] = await Promise.all([
      listResepItems(kunjunganId),
      dal.listEntries(kunjunganId),
    ]);
    // Latest-wins: rows asc → tulisan terakhir per (item×tanggal×shift) menang.
    const latest = new Map<string, MarEntryEntity>();
    for (const r of rows) latest.set(`${r.resepItemId}|${r.tanggal}|${r.shift}`, r);
    return {
      items: items.map(toObatDTO),
      entries: Array.from(latest.values()).map(toEntryDTO),
    };
  }

  /** Catat 1 pemberian (append; koreksi = kirim ulang slot sama). */
  async function addEntry(kunjunganId: string, input: MarEntryInput, actor: Actor): Promise<MarEntryDTO> {
    await assertKunjungan(kunjunganId);
    const item = (await listResepItems(kunjunganId)).find((i) => i.id === input.resepItemId);
    if (!item) throw Errors.notFound("Obat tidak ditemukan pada resep kunjungan ini");
    if (item.isHAM && input.status === "Diberikan" && !input.perawat2) {
      throw Errors.validation("Obat High Alert wajib diverifikasi perawat ke-2 saat pemberian");
    }
    const perawat = input.perawat?.trim() || (await resolveActorNama(actor));
    const row = await dal.createEntry({
      kunjunganId,
      resepItemId: item.id,
      namaObat: item.namaObat, // snapshot medikolegal
      dosis: item.dosis ?? "",
      rute: item.rute ?? "",
      tanggal: input.tanggal,
      shift: input.shift,
      status: input.status,
      waktuPemberian: input.status === "Diberikan" ? input.waktuPemberian ?? null : null,
      perawat,
      perawat2: input.perawat2 ?? "",
      catatan: input.catatan ?? "",
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toEntryDTO(row);
  }

  return { get, addEntry };
}

export const marService = makeMarService();
