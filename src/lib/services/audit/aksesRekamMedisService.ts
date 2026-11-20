// Log akses BACA rekam medis (PRD Kepatuhan E5 · FR-5.1 · SECURITY-GAP SG-10).
//
// recordRead — dipanggil route() lewat `after()` (sesudah respons terkirim) untuk:
//   • setiap GET ber-scopeKunjungan (semua rekam medis clinical.*) — otomatis;
//   • rute GET lain yang menampilkan data pasien dan memasang opsi `aksesLog`;
//   • percobaan akses kunjungan di luar unit kerja (outcome "denied"), method apa pun.
// Gagal mencatat TIDAK menggagalkan pelayanan: error ditulis ke log server untuk dipantau.
//
// list — halaman Jejak Akses (gate audit.akses:read). Membuka log ikut dicatat (jalur "audit").

import { createHmac, randomUUID } from "node:crypto";
import type { Actor } from "@/lib/auth/actor";
import { isAncillaryActor, unitScopeBypassed } from "@/lib/auth/careUnit";
import { Errors } from "@/lib/errors/appError";
import * as defaultDal from "@/lib/dal/audit/aksesRekamMedisDal";
import type {
  AksesJalur,
  AksesOutcome,
  AksesPegawaiOptionDTO,
  AksesPegawaiQuery,
  AksesRekamMedisDTO,
  AksesRekamMedisListDTO,
  AksesRekamMedisQuery,
  AksesSubjekDTO,
} from "@/lib/schemas/audit/aksesRekamMedis";

/** Jendela dedup: akses berulang ke subjek yang sama dalam 15 menit = 1 baris. */
export const BUCKET_MS = 15 * 60 * 1000;
/** Tanggal filter ditafsirkan dalam WIB. */
const ZONA = "+07:00";

export interface AksesSubject {
  kunjunganId?: string | null;
  patientId?: string | null;
  unit?: string | null;
}

export interface RecordReadInput extends AksesSubject {
  actor: Actor;
  /** Bagian yang dibuka, mis. "cppt". */
  domain: string;
  outcome: AksesOutcome;
  ip: string | null;
  at?: Date;
}

type Dal = typeof defaultDal;

export function bucketStart(at: Date): Date {
  return new Date(Math.floor(at.getTime() / BUCKET_MS) * BUCKET_MS);
}

/** Jalur hak yang dipakai actor untuk membuka unit ini. */
export function jalurAkses(actor: Actor, unit: string | null | undefined): AksesJalur {
  if (unit && actor.careUnits.includes(unit)) return "unit";
  if (isAncillaryActor(actor)) return "penunjang";
  if (unitScopeBypassed(actor)) return "global";
  return "unit";
}

/** HMAC IP — korelasi tanpa menyimpan IP mentah. */
export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const key = process.env.AUTH_SECRET ?? "ehis-akses-log";
  return createHmac("sha256", key).update(ip).digest("hex").slice(0, 32);
}

/** IP klien dari header proxy (sama dengan auth login). */
export function clientIp(req: Request): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    null
  );
}

/** "/api/v1/kunjungan/<id>/cppt/…" → "cppt"; detail kunjungan → "kunjungan". */
export function domainFromPath(pathname: string): string {
  const parts = pathname.replace(/^\/api\/v\d+\//, "").split("/").filter(Boolean);
  if (parts[0] === "kunjungan") return parts[2] ?? "kunjungan";
  return parts[0] ?? "lainnya";
}

function encodeCursor(lastAt: Date, id: string): string {
  return Buffer.from(`${lastAt.toISOString()}|${id}`).toString("base64url");
}

function decodeCursor(raw: string): { lastAt: Date; id: string } {
  const [iso, id] = Buffer.from(raw, "base64url").toString("utf8").split("|");
  const lastAt = new Date(iso ?? "");
  if (!id || Number.isNaN(lastAt.getTime())) throw Errors.validation("Cursor tidak valid");
  return { lastAt, id };
}

function toDto(r: defaultDal.AksesRow): AksesRekamMedisDTO {
  return {
    id: r.id,
    firstAt: r.first_at.toISOString(),
    lastAt: r.last_at.toISOString(),
    hitCount: r.hit_count,
    outcome: r.outcome as AksesOutcome,
    jalur: r.jalur as AksesJalur,
    domains: r.domains,
    unit: r.unit,
    roles: r.roles,
    pegawai: { id: r.pegawai_id, nama: r.pegawai_nama, nip: r.pegawai_nip },
    pasien: { id: r.patient_id, noRm: r.no_rm, nama: r.pasien_nama },
    kunjungan: { id: r.kunjungan_id, noKunjungan: r.no_kunjungan },
  };
}

export function makeAksesRekamMedisService(dal: Dal = defaultDal) {
  async function recordRead(input: RecordReadInput): Promise<void> {
    try {
      let { patientId = null, unit = null } = input;
      const kunjunganId = input.kunjunganId ?? null;
      if (kunjunganId && (!patientId || !unit)) {
        const s = await dal.findKunjunganSubject(kunjunganId);
        patientId = patientId ?? s?.patient_id ?? null;
        unit = unit ?? s?.unit ?? null;
      }
      if (!patientId && !kunjunganId) return; // tak ada subjek pasien → bukan akses RM

      const at = input.at ?? new Date();
      await dal.upsert({
        id: randomUUID(),
        userId: input.actor.userId,
        pegawaiId: input.actor.pegawaiId || null,
        roles: input.actor.roles,
        patientId,
        kunjunganId,
        subjectKey: kunjunganId ?? `p:${patientId}`,
        unit,
        jalur: jalurAkses(input.actor, unit),
        domains: [input.domain],
        outcome: input.outcome,
        ipHash: hashIp(input.ip),
        bucketStart: bucketStart(at),
        at,
      });
    } catch (e) {
      console.error("[akses-rm] gagal mencatat akses:", (e as Error).message);
    }
  }

  async function recordAuditView(actor: Actor, patientId: string | null, domain: string, ip: string | null) {
    const at = new Date();
    try {
      await dal.upsert({
        id: randomUUID(),
        userId: actor.userId,
        pegawaiId: actor.pegawaiId || null,
        roles: actor.roles,
        patientId,
        kunjunganId: null,
        subjectKey: `audit:${randomUUID()}`, // tiap pencarian log = baris sendiri
        unit: null,
        jalur: "audit",
        domains: [domain],
        outcome: "allowed",
        ipHash: hashIp(ip),
        bucketStart: bucketStart(at),
        at,
      });
    } catch (e) {
      console.error("[akses-rm] gagal mencatat pembukaan log:", (e as Error).message);
    }
  }

  async function list(q: AksesRekamMedisQuery, actor: Actor, ip: string | null): Promise<AksesRekamMedisListDTO> {
    let subjek: AksesSubjekDTO;
    if (q.noRm) {
      const p = await dal.findPasienByNoRm(q.noRm);
      if (!p) throw Errors.notFound("Pasien dengan No. RM tersebut tidak ditemukan");
      subjek = { jenis: "pasien", id: p.id, noRm: p.no_rm, nama: p.nama };
    } else {
      const pg = await dal.findPegawai(q.pegawaiId!);
      if (!pg) throw Errors.notFound("Pegawai tidak ditemukan");
      subjek = { jenis: "pegawai", id: pg.id, nama: pg.nama_lengkap, nip: pg.nip };
    }

    const dari = q.dari ? new Date(`${q.dari}T00:00:00.000${ZONA}`) : undefined;
    const sampai = q.sampai
      ? new Date(new Date(`${q.sampai}T00:00:00.000${ZONA}`).getTime() + 24 * 60 * 60 * 1000)
      : undefined;
    if (dari && sampai && dari >= sampai) throw Errors.validation("Rentang tanggal tidak valid");

    const rows = await dal.list({
      patientId: subjek.jenis === "pasien" ? subjek.id : undefined,
      pegawaiId: subjek.jenis === "pegawai" ? subjek.id : undefined,
      dari,
      sampai,
      cursor: q.cursor ? decodeCursor(q.cursor) : undefined,
      limit: q.limit,
    });

    // Membuka log = akses terhadap data akses pasien → dicatat (halaman pertama saja).
    if (!q.cursor) {
      await recordAuditView(
        actor,
        subjek.jenis === "pasien" ? subjek.id : null,
        subjek.jenis === "pasien" ? "jejak-akses:pasien" : "jejak-akses:pegawai",
        ip,
      );
    }

    const hasMore = rows.length > q.limit;
    const page = hasMore ? rows.slice(0, q.limit) : rows;
    const last = page[page.length - 1];
    return {
      subjek,
      items: page.map(toDto),
      nextCursor: hasMore && last ? encodeCursor(last.last_at, last.id) : null,
    };
  }

  async function searchPegawai(q: AksesPegawaiQuery): Promise<AksesPegawaiOptionDTO[]> {
    const rows = await dal.searchPegawai(q.q);
    return rows.map((r) => ({ id: r.id, nama: r.nama_lengkap, nip: r.nip }));
  }

  return { recordRead, list, searchPegawai };
}

export const aksesRekamMedisService = makeAksesRekamMedisService();
