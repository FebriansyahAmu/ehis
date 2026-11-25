"use client";

// BPJS V-Claim → Cek Kepesertaan. Kolom kiri sempit (form + riwayat sesi), kanan lebar (hasil).
// Gaya shadcn (Button/Badge, token --ui-* beraksen sky via data-accent). State query dipegang
// di sini agar riwayat bisa mengisi ulang form; respons basi (pencarian yang sudah disusul)
// diabaikan lewat nomor permintaan.

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Loader2, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSkeletonDelay } from "@/components/master/shared";
import { getPesertaByKartu, getPesertaByNik } from "@/lib/bpjs/vClaimKepesertaan";
import CekPesertaForm from "./CekPesertaForm";
import PesertaDetailCard from "./PesertaDetailCard";
import { RiwayatPencarian } from "./RiwayatPencarian";
import {
  errorLabel,
  hariIni,
  toYmd,
  type KepesertaanResult,
  type Query,
  type RiwayatItem,
} from "./kepesertaanShared";

function PageSkeleton() {
  return (
    <div className="flex h-full flex-col" aria-hidden="true">
      <div className="h-15 shrink-0" />
      <div className="grid flex-1 gap-4 p-4 sm:p-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="h-96 rounded-xl bg-muted motion-safe:animate-pulse" />
        <div className="h-96 rounded-xl bg-muted motion-safe:animate-pulse" />
      </div>
    </div>
  );
}

function ringkas(r: KepesertaanResult): string {
  if (r.status === "loading") return "Menghubungi V-Claim";
  if (r.status === "found") {
    return `Peserta ditemukan: ${r.peserta.nama}, ${r.peserta.statusPeserta.kode === "0" ? "aktif" : "tidak aktif"}`;
  }
  if (r.status === "error") return errorLabel(r.error).title;
  return "";
}

export default function KepesertaanPage() {
  const loaded = useSkeletonDelay(400);

  const [query, setQuery] = useState<Query>(() => ({ mode: "kartu", value: "", tgl: toYmd(hariIni()) }));
  const [result, setResult] = useState<KepesertaanResult>({ status: "idle" });
  const [riwayat, setRiwayat] = useState<RiwayatItem[]>([]);
  const lastQuery = useRef<Query | null>(null);
  const reqId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const cek = useCallback(async (q: Query) => {
    const id = ++reqId.current;
    lastQuery.current = q;
    setResult({ status: "loading" });

    let next: KepesertaanResult;
    try {
      const res = q.mode === "kartu" ? await getPesertaByKartu(q.value, q.tgl) : await getPesertaByNik(q.value, q.tgl);
      if (res.ok && res.value.response) next = { status: "found", peserta: res.value.response };
      else if (res.ok)
        next = {
          status: "error",
          error: { type: "BPJSMetaError", code: "201", message: "Peserta tidak ditemukan", endpoint: "", retryable: false },
        };
      else next = { status: "error", error: res.error };
    } catch {
      next = {
        status: "error",
        error: { type: "BPJSMetaError", code: "503", message: "Koneksi ke V-Claim gagal", endpoint: "", retryable: true },
      };
    }

    if (id !== reqId.current) return; // sudah disusul pencarian lain
    setResult(next);
    const item: RiwayatItem = {
      ...q,
      id: `${q.mode}-${q.value}-${Date.now()}`,
      at: Date.now(),
      nama: next.status === "found" ? next.peserta.nama : null,
      aktif: next.status === "found" ? next.peserta.statusPeserta.kode === "0" : null,
      pesan: next.status === "error" ? errorLabel(next.error).title : null,
    };
    setRiwayat((prev) => [item, ...prev.filter((r) => !(r.mode === q.mode && r.value === q.value))].slice(0, 6));
  }, []);

  const ulang = useCallback(() => {
    if (lastQuery.current) void cek(lastQuery.current);
  }, [cek]);

  const cariLagi = useCallback(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  if (!loaded) return <PageSkeleton />;

  const busy = result.status === "loading";

  return (
    <MotionConfig reducedMotion="user">
      {/* text-foreground: jangan mewarisi warna body (berubah putih saat OS mode gelap). */}
      <div data-accent="sky" className="flex h-full min-h-0 flex-col text-foreground">
        <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 px-4 pt-4 sm:px-5 sm:pt-5">
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700"
          >
            <UserCheck className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold text-foreground">Cek kepesertaan</h1>
            <p className="truncate text-xs text-muted-foreground">
              Status peserta JKN dari V-Claim berdasarkan nomor kartu atau NIK
            </p>
          </div>
          <AnimatePresence>
            {busy && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="inline-flex items-center gap-1.5 text-xs text-sky-700"
              >
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                Menghubungi V-Claim
              </motion.span>
            )}
          </AnimatePresence>
          <Badge variant="secondary" className="bg-white text-[11px] text-muted-foreground tabular-nums shadow-xs">
            V-Claim 5.0
          </Badge>
        </header>

        <p role="status" className="sr-only">
          {ringkas(result)}
        </p>

        <div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto p-4 sm:p-5 lg:grid-cols-[20rem_minmax(0,1fr)] lg:content-stretch lg:overflow-hidden">
          <aside className="flex flex-col gap-4 lg:min-h-0 lg:overflow-y-auto">
            <section aria-labelledby="form-judul" className="rounded-xl bg-card p-4 shadow-sm">
              <h2 id="form-judul" className="mb-3 text-sm font-semibold text-foreground">
                Pencarian peserta
              </h2>
              <CekPesertaForm query={query} onChange={setQuery} onSubmit={cek} busy={busy} inputRef={inputRef} />
            </section>
            <RiwayatPencarian
              items={riwayat}
              onPilih={(r) => {
                const q: Query = { mode: r.mode, value: r.value, tgl: r.tgl };
                setQuery(q);
                void cek(q);
              }}
              onHapus={() => setRiwayat([])}
            />
          </aside>

          <section aria-label="Hasil pencarian" className="min-w-0 lg:min-h-0 lg:overflow-y-auto">
            <PesertaDetailCard result={result} onRetry={ulang} onCariLagi={cariLagi} />
          </section>
        </div>
      </div>
    </MotionConfig>
  );
}
