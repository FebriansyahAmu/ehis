"use client";

// Halaman Jejak Akses Rekam Medis (PRD Kepatuhan E5 · FR-5.1). Unit RM / DPO menjawab
// "siapa membuka RM pasien X" atau "pasien siapa saja yang dibuka pegawai Y". Data dari
// auth.akses_rekam_medis (append-only). Membuka halaman ini untuk seorang pasien ikut tercatat.

import { useId, useRef, useState } from "react";
import { History, Lock, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";
import {
  listJejakAkses,
  type AksesRekamMedisDTO,
  type AksesSubjekDTO,
  type JejakAksesParams,
} from "@/lib/api/audit/aksesRekamMedis";
import { JejakAksesFilter, type JejakFilterValue, type JejakMode } from "./JejakAksesFilter";
import { JejakAksesTable } from "./JejakAksesTable";
import { tanggalWib } from "./jejakAksesShared";

interface Hasil {
  mode: JejakMode;
  subjek: AksesSubjekDTO;
  items: AksesRekamMedisDTO[];
  nextCursor: string | null;
  params: JejakAksesParams;
}

function pesanError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 403) return "Anda tidak punya izin melihat jejak akses (audit.akses:read).";
    return e.message;
  }
  return "Gagal memuat jejak akses. Periksa koneksi lalu coba lagi.";
}

function SkeletonRows() {
  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="h-10 rounded bg-slate-100 motion-safe:animate-pulse" />
      ))}
    </div>
  );
}

export default function JejakAksesPage() {
  const captionId = useId();
  const ctrl = useRef<AbortController | null>(null);
  const [filter, setFilter] = useState<JejakFilterValue>({
    mode: "pasien",
    noRm: "",
    pegawai: null,
    dari: tanggalWib(-30),
    sampai: tanggalWib(0),
  });
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "more" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function muat(params: JejakAksesParams, append: boolean) {
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setStatus(append ? "more" : "loading");
    setError(null);
    try {
      const res = await listJejakAkses(params, c.signal);
      setHasil((prev) => ({
        mode: params.noRm ? "pasien" : "pegawai",
        subjek: res.subjek,
        items: append && prev ? [...prev.items, ...res.items] : res.items,
        nextCursor: res.nextCursor,
        params,
      }));
      setStatus("idle");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError(pesanError(e));
      setStatus("error");
      if (!append) setHasil(null);
    }
  }

  function cari() {
    void muat(
      {
        noRm: filter.mode === "pasien" ? filter.noRm.trim() : undefined,
        pegawaiId: filter.mode === "pegawai" ? filter.pegawai?.id : undefined,
        dari: filter.dari || undefined,
        sampai: filter.sampai || undefined,
        limit: 50,
      },
      false,
    );
  }

  const items = hasil?.items ?? [];
  const ditolak = items.filter((a) => a.outcome === "denied").length;
  const global = items.filter((a) => a.jalur === "global").length;
  const busy = status === "loading" || status === "more";

  return (
    <div data-accent="teal" className="min-h-full space-y-4 bg-slate-50 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900">
            <History className="size-5 text-teal-700" aria-hidden="true" />
            Jejak Akses Rekam Medis
          </h1>
          <p className="m-sm mt-1 max-w-3xl text-slate-600">
            Siapa membuka rekam medis pasien, kapan, dan bagian apa. Dicatat otomatis setiap kali data pasien
            dibuka; akses berulang dalam 15 menit digabung menjadi satu baris.
          </p>
        </div>
        <Badge variant="outline" className="gap-1 border-transparent bg-slate-200/70 text-slate-700">
          <Lock className="size-3" aria-hidden="true" />
          Tidak bisa diubah atau dihapus
        </Badge>
      </header>

      <Card className="py-4">
        <CardContent className="px-4">
          <JejakAksesFilter value={filter} onChange={setFilter} onSubmit={cari} busy={busy} />
        </CardContent>
      </Card>

      <section aria-labelledby={hasil ? `${captionId}-judul` : undefined} aria-label={hasil ? undefined : "Hasil jejak akses"} className="space-y-3">
        <div aria-live="polite" className="sr-only">
          {status === "loading" ? "Memuat jejak akses" : hasil ? `${items.length} entri ditampilkan` : ""}
        </div>

        {error && (
          <div role="alert" className="m-sm flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-rose-800 ring-1 ring-inset ring-rose-200">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        {status === "loading" && <SkeletonRows />}

        {status !== "loading" && !hasil && !error && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
            <p className="m-sm font-medium text-slate-700">Pilih pasien atau pegawai, lalu tekan Tampilkan.</p>
            <p className="m-xs mt-1 text-slate-500">
              Yang tercatat: siapa, kapan, kunjungan, bagian yang dibuka, jalur hak akses, dan percobaan yang
              ditolak. Isi rekam medis tidak disimpan di log.
            </p>
          </div>
        )}

        {hasil && status !== "loading" && (
          <>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div className="min-w-0">
                <h2 id={`${captionId}-judul`} className="m-base font-semibold text-slate-900">
                  {hasil.subjek.nama}
                  <span className="m-sm ml-2 font-normal text-slate-500">
                    {hasil.subjek.jenis === "pasien"
                      ? `No. RM ${hasil.subjek.noRm}`
                      : hasil.subjek.nip
                        ? `NIP ${hasil.subjek.nip}`
                        : "Pegawai"}
                  </span>
                </h2>
              </div>
              <ul role="list" className="m-xs flex flex-wrap gap-1.5">
                <li className="rounded-md bg-white px-2 py-1 text-slate-700 ring-1 ring-inset ring-slate-200 tabular-nums">
                  {items.length}
                  {hasil.nextCursor ? "+" : ""} entri
                </li>
                {ditolak > 0 && (
                  <li className="rounded-md bg-rose-50 px-2 py-1 font-medium text-rose-800 tabular-nums">
                    {ditolak} ditolak
                  </li>
                )}
                {global > 0 && (
                  <li className="rounded-md bg-amber-50 px-2 py-1 font-medium text-amber-800 tabular-nums">
                    {global} lewat hak global
                  </li>
                )}
              </ul>
            </div>

            {items.length === 0 ? (
              <p className="m-sm rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-slate-500">
                Belum ada akses tercatat pada rentang tanggal ini.
              </p>
            ) : (
              <JejakAksesTable
                items={items}
                mode={hasil.mode}
                captionId={captionId}
                caption={`Jejak akses ${hasil.subjek.jenis === "pasien" ? "rekam medis" : "oleh"} ${hasil.subjek.nama}, terbaru di atas`}
              />
            )}

            {hasil.nextCursor && (
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void muat({ ...hasil.params, cursor: hasil.nextCursor ?? undefined }, true)}
                >
                  {status === "more" ? "Memuat…" : "Muat lebih lama"}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
