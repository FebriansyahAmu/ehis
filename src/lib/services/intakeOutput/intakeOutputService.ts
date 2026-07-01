// intakeOutputService — Balance Cairan (tab Intake/Output, rekam medis shared, dominan RI).
// Entri = append-only time-series (add/soft-delete); target = latest-wins (set penuh). Pencatat/
// updatedBy = nama actor (user login). RBAC clinical.rekammedis di Route; ABAC careUnit di route()
// choke-point. waktu = timestamptz (wall-clock UTC, selaras observationService); shift diturunkan
// dari waktu bila tak dikirim.

import * as defaultDal from "@/lib/dal/intakeOutput/intakeOutputDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { EntryEntity, TargetEntity } from "@/lib/dal/intakeOutput/intakeOutputDal";
import {
  type IOEntryInput, type IOTargetInput,
  type IntakeOutputDTO, type IOEntryDTO, type IOTargetDTO,
  type IOTipe, type IOShift, type IOKategori,
} from "@/lib/schemas/intakeOutput/intakeOutput";

type Dal = typeof defaultDal;

/** datetime-local ("YYYY-MM-DDTHH:mm") / ISO → Date. Tanpa tz → UTC wall-clock (deterministik,
 *  selaras observationService: nilai yang diinput = yang di-render kembali). */
function parseWaktu(raw: string | undefined, now: Date): Date {
  if (!raw) return now;
  const hasTz = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(raw);
  const s = hasTz ? raw : `${raw.length === 16 ? `${raw}:00` : raw}Z`;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw Errors.validation("Waktu entri tidak valid");
  return d;
}

/** Shift dari jam (UTC wall-clock) — mirror detectShift FE. */
function deriveShift(waktu: Date): IOShift {
  const h = waktu.getUTCHours();
  if (h >= 7 && h < 14) return "Pagi";
  if (h >= 14 && h < 21) return "Siang";
  return "Malam";
}

function asShift(v: string): IOShift { return v === "Siang" || v === "Malam" ? v : "Pagi"; }

function toEntryDTO(e: EntryEntity): IOEntryDTO {
  const iso = e.waktu.toISOString();
  return {
    id: e.id,
    waktu: iso.slice(11, 16), // HH:MM
    tanggal: iso.slice(0, 10), // YYYY-MM-DD
    shift: asShift(e.shift),
    tipe: e.tipe as IOTipe,
    kategori: e.kategori as IOKategori,
    subKategori: e.subKategori || undefined,
    volume: e.volume,
    catatan: e.catatan || undefined,
  };
}

function toTargetDTO(t: TargetEntity): IOTargetDTO {
  return {
    restriksiIntake: t.restriksiIntake ?? undefined,
    targetBalance: t.targetBalance ?? undefined,
    catatan: t.catatan || undefined,
    updatedBy: t.updatedBy || undefined,
    updatedAt: t.createdAt.toISOString(),
  };
}

export function makeIntakeOutputService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  /** Agregat: seluruh entri + target terkini. */
  async function get(kunjunganId: string, _actor: Actor): Promise<IntakeOutputDTO> {
    await assertKunjungan(kunjunganId);
    const [entries, target] = await Promise.all([
      dal.listEntries(kunjunganId),
      dal.latestTarget(kunjunganId),
    ]);
    return {
      entries: entries.map(toEntryDTO),
      target: target ? toTargetDTO(target) : null,
    };
  }

  /** Tambah 1 entri cairan (append). */
  async function addEntry(kunjunganId: string, input: IOEntryInput, actor: Actor): Promise<IOEntryDTO> {
    await assertKunjungan(kunjunganId);
    const waktu = parseWaktu(input.waktu, new Date());
    const pencatat = input.pencatat?.trim() || (await resolveActorNama(actor));
    const row = await dal.createEntry({
      kunjunganId,
      tipe: input.tipe,
      kategori: input.kategori,
      subKategori: input.subKategori?.trim() ?? "",
      volume: input.volume,
      shift: input.shift ?? deriveShift(waktu),
      catatan: input.catatan?.trim() ?? "",
      waktu,
      pencatat,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toEntryDTO(row);
  }

  /** Soft-delete 1 entri (entered-in-error). */
  async function removeEntry(kunjunganId: string, itemId: string, _actor: Actor): Promise<void> {
    await assertKunjungan(kunjunganId);
    const item = await dal.findEntryById(itemId);
    if (!item || item.kunjunganId !== kunjunganId || item.deletedAt) {
      throw Errors.notFound("Entri intake/output tidak ditemukan");
    }
    await dal.softDeleteEntry(itemId);
  }

  /** Set target DPJP (latest-wins: baris baru). Field absen → null (bersihkan). */
  async function setTarget(kunjunganId: string, input: IOTargetInput, actor: Actor): Promise<IOTargetDTO> {
    await assertKunjungan(kunjunganId);
    const updatedBy = input.updatedBy?.trim() || (await resolveActorNama(actor));
    const row = await dal.createTarget({
      kunjunganId,
      restriksiIntake: input.restriksiIntake ?? null,
      targetBalance: input.targetBalance ?? null,
      catatan: input.catatan?.trim() ?? "",
      updatedBy,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toTargetDTO(row);
  }

  return { get, addEntry, removeEntry, setTarget };
}

export const intakeOutputService = makeIntakeOutputService();
