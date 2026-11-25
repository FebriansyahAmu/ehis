/**
 * V-Claim Adapter (browser) — Kepesertaan.
 *
 * Methods:
 * - `getPesertaByKartu` — `/Peserta/nokartu/{noKartu}/tglSEP/{tgl}`
 * - `getPesertaByNik`   — `/Peserta/nik/{nik}/tglSEP/{tgl}`
 *
 * Dulu mencari langsung di `PESERTA_MOCK` di browser (kredensial `.env` tak pernah terpakai).
 * Kini memanggil BFF `POST /api/v1/bpjs/peserta/cek`; server yang memilih data uji atau V-Claim
 * nyata (BPJS_MODE / BPJS_BACA_LIVE) dan mencatat audit DB. `wrapWithAudit` di sini tetap
 * mengisi log sesi (Audit trail & Beranda BPJS; endpoint disamarkan).
 *
 * Galat BFF → `BPJSError`: sesi/akses → AuthError · masukan → ValidationError · dibatasi laju →
 * NetworkError `retryable:false` · BPJS tak terjangkau/konfigurasi → NetworkError `retryable:true`.
 */

import { ApiError } from "@/lib/api/client";
import { cekPesertaBpjs } from "@/lib/api/bpjs/peserta";
import type { JenisCekPeserta } from "@/lib/schemas/bpjs/peserta";
import { Err, type BPJSEnvelope, type BPJSError, type PesertaRecord, type Result } from "./bpjsShared";
import { errEnvelope, okEnvelope, wrapWithAudit } from "./vClaimShared";
import { VCLAIM_ENDPOINTS } from "./bpjsEndpoints";

function keGalat(e: unknown): BPJSError {
  if (e instanceof ApiError) {
    if (e.code === "UNAUTHENTICATED") return { type: "AuthError", message: "Sesi berakhir. Silakan masuk kembali." };
    if (e.code === "FORBIDDEN") return { type: "AuthError", message: "Akun Anda tidak memiliki akses cek kepesertaan BPJS." };
    if (e.code === "VALIDATION") {
      const field = e.fieldErrors()[0]?.path ?? "nomor";
      return { type: "ValidationError", field, message: e.message };
    }
    if (e.code === "RATE_LIMITED") return { type: "NetworkError", message: e.message, retryable: false };
    return { type: "NetworkError", message: e.message, retryable: true };
  }
  return { type: "NetworkError", message: "Tidak dapat terhubung ke server EHIS.", retryable: true };
}

function cek(jenis: JenisCekPeserta, nomor: string, tglSEP: string, endpoint: string): Promise<Result<BPJSEnvelope<PesertaRecord>, BPJSError>> {
  return wrapWithAudit<PesertaRecord>({ endpoint, method: "GET" }, async () => {
    try {
      const dto = await cekPesertaBpjs({ jenis, nomor, tgl: tglSEP });
      return dto.ok ? okEnvelope(dto.peserta) : errEnvelope(dto.galat.code, endpoint, dto.galat.message);
    } catch (e) {
      return Err(keGalat(e));
    }
  })();
}

export function getPesertaByKartu(noKartu: string, tglSEP: string): Promise<Result<BPJSEnvelope<PesertaRecord>, BPJSError>> {
  return cek("kartu", noKartu, tglSEP, VCLAIM_ENDPOINTS.peserta.byNoKartu(noKartu, tglSEP));
}

export function getPesertaByNik(nik: string, tglSEP: string): Promise<Result<BPJSEnvelope<PesertaRecord>, BPJSError>> {
  return cek("nik", nik, tglSEP, VCLAIM_ENDPOINTS.peserta.byNik(nik, tglSEP));
}
