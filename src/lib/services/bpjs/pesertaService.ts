import "server-only";

// Service cek kepesertaan V-Claim (panggilan BACA per pengguna). Mode:
// • BPJS_MODE=mock tanpa BPJS_BACA_LIVE → data uji `PESERTA_MOCK` (perilaku lama halaman).
// • sandbox/prod, atau mock + BPJS_BACA_LIVE=true → GET `Peserta/...` ke V-Claim nyata (callBpjs).
//   Write (SEP/SPRI/rencana kontrol) TIDAK ikut — tetap mengikuti BPJS_MODE.
// Jalur nyata: env lengkap? → batas per pengguna (30/menit, anti panen data) → kuota harian
// cons-id → auditedCall (1 baris DB, nomor di-HASH, R9) → validasi Zod + petakan respons.
// Respons berisi data pribadi: TIDAK di-log (R14), TIDAK di-cache (status bisa berubah kapan saja),
// dan pesan galat ke klien tidak memuat URL (URL berisi nomor kartu/NIK).

import type { Actor } from "@/lib/auth/actor";
import { Errors } from "@/lib/errors/appError";
import { bacaBpjsLive, getBpjsConfig, type BpjsConfig } from "@/lib/bpjs/server/config";
import { BpjsConfigError, BpjsDecodeError } from "@/lib/bpjs/server/errors";
import { callBpjs } from "@/lib/bpjs/server/httpClient";
import { consumeRateLimit, consumeWindow } from "@/lib/bpjs/server/rateLimit";
import type { BPJSEnvelope, BPJSError, Result } from "@/lib/bpjs/bpjsShared";
import { PESERTA_MOCK } from "@/lib/bpjs/mock/pesertaMock";
import {
  PESERTA_ENDPOINT_AUDIT,
  PesertaResponseSchema,
  pesertaPath,
  toPesertaRecord,
  type CekPesertaInput,
  type PesertaCekDTO,
} from "@/lib/schemas/bpjs/peserta";
import { auditedCall } from "./audit";

/** Batas pencarian peserta per pengguna per menit (cukup untuk loket tersibuk, menahan skrip massal). */
const BATAS_PER_MENIT = 30;

const PESAN_KONFIG = "Koneksi BPJS belum dikonfigurasi dengan benar di server. Hubungi admin sistem.";

function muatConfig(): BpjsConfig {
  try {
    return getBpjsConfig();
  } catch (e) {
    console.error(`[bpjs-peserta] ${(e as Error).name}: ${(e as Error).message}`);
    throw Errors.upstream(PESAN_KONFIG);
  }
}

/** Data uji — sama dengan perilaku adapter mock lama (201 tidak ditemukan, 203 non-aktif). */
function cekUji({ jenis, nomor }: CekPesertaInput): PesertaCekDTO {
  const p = PESERTA_MOCK.find((x) => (jenis === "kartu" ? x.noKartu : x.nik) === nomor);
  if (!p) return { ok: false, sumber: "uji", galat: { code: "201", message: "Peserta tidak ditemukan" } };
  if (p.statusPeserta.kode !== "0") return { ok: false, sumber: "uji", galat: { code: "203", message: "Status peserta Non-Aktif" } };
  return { ok: true, sumber: "uji", peserta: p };
}

export async function cekPeserta(input: CekPesertaInput, actor: Actor): Promise<PesertaCekDTO> {
  const cfg = muatConfig();
  if (!bacaBpjsLive(cfg)) return cekUji(input);

  if (cfg.envKurang.length > 0) {
    console.error(`[bpjs-peserta] panggilan nyata dibatalkan — env belum diisi: ${cfg.envKurang.join(", ")}`);
    throw Errors.upstream(PESAN_KONFIG);
  }

  const batas = consumeWindow(`peserta:${actor.userId}`, BATAS_PER_MENIT, 60_000);
  if (!batas.ok) {
    throw Errors.rateLimited(`Terlalu banyak pencarian peserta. Coba lagi dalam ${batas.retryAfterSec} detik.`, {
      retryAfterSec: batas.retryAfterSec,
    });
  }
  if (!consumeRateLimit(cfg.consId).ok) {
    throw Errors.rateLimited("Kuota harian panggilan BPJS rumah sakit ini sudah habis. Coba lagi besok.");
  }

  const path = pesertaPath(input.jenis, input.nomor, input.tgl);
  let res: Result<BPJSEnvelope<unknown>, BPJSError>;
  try {
    res = await auditedCall<unknown>(
      {
        service: "vclaim",
        endpoint: PESERTA_ENDPOINT_AUDIT[input.jenis],
        method: "GET",
        actor: actor.userId,
        actorRole: actor.roles[0] ?? "-",
        ...(input.jenis === "kartu" ? { noKartu: input.nomor } : { nik: input.nomor }),
      },
      // allowInMock: hanya berlaku saat BPJS_MODE=mock + BPJS_BACA_LIVE (sudah dicek di atas).
      () => callBpjs<unknown>({ service: "vclaim", method: "GET", path, allowInMock: true }),
    );
  } catch (e) {
    if (e instanceof BpjsConfigError) {
      console.error(`[bpjs-peserta] ${e.name}: ${e.message}`);
      throw Errors.upstream(PESAN_KONFIG);
    }
    if (e instanceof BpjsDecodeError) {
      // Pesan saja — `cause` bisa memuat potongan respons (data pribadi).
      console.error(`[bpjs-peserta] ${e.name}: ${e.message}`);
      throw Errors.upstream("Respons BPJS tidak dapat dibaca. Periksa cons secret di server.");
    }
    throw e;
  }

  if (!res.ok) {
    // Galat bisnis BPJS (201 tidak ditemukan, …) = BPJS menjawab → kembalikan ke tampilan.
    // `endpoint` galat sengaja TIDAK diteruskan (berisi nomor kartu/NIK).
    if (res.error.type === "BPJSMetaError") {
      return { ok: false, sumber: "bpjs", galat: { code: res.error.code, message: res.error.message } };
    }
    throw Errors.upstream("V-Claim tidak dapat dihubungi. Periksa koneksi server lalu coba lagi.");
  }

  if (res.value.response === undefined || res.value.response === null) {
    return { ok: false, sumber: "bpjs", galat: { code: "201", message: "Peserta tidak ditemukan" } };
  }

  const parsed = PesertaResponseSchema.safeParse(res.value.response);
  if (!parsed.success) {
    // Hanya jalur field yang bermasalah — tanpa nilai (R14).
    console.error(`[bpjs-peserta] format respons tidak dikenali: ${parsed.error.issues.map((i) => i.path.map(String).join(".")).join(", ")}`);
    throw Errors.upstream("Format respons BPJS tidak dikenali.");
  }
  return { ok: true, sumber: "bpjs", peserta: toPesertaRecord(parsed.data) };
}
