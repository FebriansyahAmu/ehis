"use client";

// Log pengiriman SatuSehat untuk 1 data (tab di drawer Prerequisites / Resource / Kunjungan).
// Paginasi KEYSET: server memberi `nextCursor`; klien menyimpan tumpukan cursor per halaman →
// Sebelumnya/Berikutnya tanpa OFFSET (biaya tetap per halaman, stabil saat panggilan baru masuk).
// Total dihitung server hanya di halaman pertama.

import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, History, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import { listSendLog, type SendLogPageDTO, type SendLogTarget } from "@/lib/api/fhir/sendLog";
import { Button, EmptyState, Pill, SkeletonRows, errMsg, isAbort } from "../fhirShared";
import { Callout } from "../resource/resourceUi";
import { SendLogEntry } from "./SendLogEntry";

const PAGE_SIZE = 10;
const MODE_TONE: Record<string, "slate" | "amber" | "emerald"> = { mock: "slate", sandbox: "amber", prod: "emerald" };

export function SendLogPanel({ target, emptyHint }: {
  target: SendLogTarget;
  /** Penjelasan khusus saat kosong (mis. root RS tak pernah dikirim). */
  emptyHint?: string;
}) {
  const headingId = useId();
  const listRef = useRef<HTMLOListElement>(null);
  const focusAfterLoad = useRef(false);
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [pageIdx, setPageIdx] = useState(0);
  const [reload, setReload] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [res, setRes] = useState<{ key: string; page: SendLogPageDTO | null; error: string | null } | null>(null);

  const { localType, localId, kunjunganId } = target;
  const cursor = cursors[pageIdx] ?? null;
  const reqKey = `${localType}|${localId}|${kunjunganId ?? ""}|${pageIdx}|${reload}`;

  useEffect(() => {
    const ac = new AbortController();
    listSendLog({ localType, localId, kunjunganId }, { cursor, limit: PAGE_SIZE }, ac.signal)
      .then((page) => {
        if (ac.signal.aborted) return;
        setRes({ key: reqKey, page, error: null });
        if (page.total !== null) setTotal(page.total);
      })
      .catch((e) => { if (!isAbort(e)) setRes({ key: reqKey, page: null, error: errMsg(e) ?? "Gagal memuat log pengiriman" }); });
    return () => ac.abort();
  }, [localType, localId, kunjunganId, cursor, reqKey]);

  const current = res?.key === reqKey ? res : null;
  const page = current?.page ?? null;
  const loading = !current;

  // Pindah halaman → fokus ke daftar baru (pembaca layar mulai dari baris pertama halaman itu).
  useEffect(() => {
    if (page && focusAfterLoad.current) {
      focusAfterLoad.current = false;
      listRef.current?.focus();
    }
  }, [page]);

  const pages = total !== null ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : null;

  function next() {
    if (!page?.nextCursor) return;
    const nc = page.nextCursor;
    setCursors((c) => [...c.slice(0, pageIdx + 1), nc]);
    setPageIdx((i) => i + 1);
    focusAfterLoad.current = true;
  }
  function prev() {
    setPageIdx((i) => Math.max(0, i - 1));
    focusAfterLoad.current = true;
  }
  function refresh() {
    setCursors([null]);
    setPageIdx(0);
    setReload((r) => r + 1);
  }

  const retensi = page?.retensiHari ?? null;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 id={headingId} className="text-sm font-bold text-slate-800">Log pengiriman</h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
            {total !== null ? `${total.toLocaleString("id-ID")} panggilan ke SatuSehat` : "Memuat…"}
            {page && <Pill label={`Mode ${page.mode}`} tone={MODE_TONE[page.mode] ?? "slate"} />}
          </p>
        </div>
        <Button variant="ghost" icon={RefreshCw} onClick={refresh} disabled={loading}>Muat ulang</Button>
      </div>

      {retensi !== null && (
        <Callout tone="teal" icon={ShieldCheck}>
          {retensi > 0
            ? <>Isi request &amp; response disimpan <b>terenkripsi {retensi} hari</b>, NIK dimasker. Buka baris untuk melihat isinya; membuka isi dicatat di log akses rekam medis.</>
            : <>Pencatatan isi request &amp; response <b>dimatikan</b> (SATUSEHAT_LOG_BODY_DAYS=0) — hanya metadata panggilan yang tercatat.</>}
        </Callout>
      )}

      {loading ? (
        <SkeletonRows rows={4} />
      ) : current?.error ? (
        <div className="flex flex-wrap items-center gap-2">
          <Callout tone="rose" icon={TriangleAlert}>{current.error}</Callout>
          <Button variant="secondary" icon={RefreshCw} onClick={() => setReload((r) => r + 1)}>Coba lagi</Button>
        </div>
      ) : page && page.rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <EmptyState
            icon={History}
            title="Belum ada panggilan tercatat"
            desc={emptyHint ?? "Panggilan tercatat sejak log pengiriman aktif. Jalankan sinkron untuk mengirim/mencari data ini di SatuSehat."}
          />
        </div>
      ) : page && (
        <ol
          ref={listRef}
          tabIndex={-1}
          aria-labelledby={headingId}
          className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          {page.rows.map((r) => <SendLogEntry key={r.id} row={r} focus={target} retensiHari={page.retensiHari} />)}
        </ol>
      )}

      {/* Navigasi tetap tampil saat halaman berikut dimuat (pakai hasil terakhir) → tak berkedip. */}
      {(pageIdx > 0 || page?.nextCursor || (loading && res?.page?.nextCursor)) && (
        <nav aria-label="Halaman log pengiriman" className="flex items-center justify-between gap-2 text-xs text-slate-500">
          <span>Halaman {pageIdx + 1}{pages ? ` dari ${pages}` : ""}</span>
          <div className="flex gap-1">
            <Button variant="secondary" icon={ChevronLeft} disabled={pageIdx === 0 || loading} onClick={prev}>Sebelumnya</Button>
            <Button variant="secondary" disabled={!page?.nextCursor || loading} onClick={next}>
              Berikutnya <ChevronRight size={13} aria-hidden />
            </Button>
          </div>
        </nav>
      )}
    </section>
  );
}
