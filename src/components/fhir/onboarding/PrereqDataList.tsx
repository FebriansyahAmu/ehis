"use client";

// Daftar data lokal 1 langkah Prerequisites (Organization · Location · Practitioner · Patient) beserta
// status peta IHS di mode aktif. Cari kode/nama · filter Semua/Terpetakan/Belum · paginasi · Detail →
// drawer data mentah (master lokal · payload FHIR / request GET by NIK) · Kirim per item (notifikasi
// berhasil/gagal) tanpa menunggu sinkron massal.

import { useCallback, useEffect, useId, useState } from "react";
import { ChevronLeft, ChevronRight, Inbox, ScanSearch, Search, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { listPrereqItems, type PrereqItemPageDTO, type PrereqJenis } from "@/lib/api/fhir/onboarding";
import { useSendPrereqItem } from "./useSendPrereqItem";
import {
  Button, EmptyState, FHIR_ACCENT, Pill, SectionCard, SkeletonRows, errMsg, isAbort,
  tableCls, tableWrap, tdCls, thCls, trCls,
} from "../fhirShared";
import { IdChip } from "../resource/resourceUi";
import { fmtRelative } from "../resource/resourceTime";
import { PREREQ_RESOURCE, PrereqDetailDrawer } from "./PrereqDetailDrawer";

type StatusFilter = "semua" | "terpetakan" | "belum";
const PAGE_SIZE = 20;

const STATUS_OPTS: { value: StatusFilter; label: string }[] = [
  { value: "semua", label: "Semua" },
  { value: "terpetakan", label: "Terpetakan" },
  { value: "belum", label: "Belum" },
];

export function PrereqDataList({
  jenis,
  refreshKey,
  onClose,
  canSend = false,
  onItemSent,
}: {
  jenis: PrereqJenis;
  /** Naik setiap sinkron selesai → daftar dimuat ulang. */
  refreshKey: number;
  onClose: () => void;
  /** Izin `fhir.sync:create` — tombol Kirim per item. */
  canSend?: boolean;
  /** Setelah 1 item dikirim (mis. muat ulang ringkasan langkah di halaman induk). */
  onItemSent?: () => void;
}) {
  const resource = PREREQ_RESOURCE[jenis];
  const searchId = useId();
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("semua");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PrereqItemPageDTO | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  // Sesudah kirim: segarkan baris (status/IHS id) di halaman yang sama + ringkasan induk.
  const afterSend = useCallback(() => {
    setReload((r) => r + 1);
    onItemSent?.();
  }, [onItemSent]);
  const { send, isBusy } = useSendPrereqItem(jenis, afterSend);
  const isGetOnly = jenis === "practitioner" || jenis === "patient";
  const SendIcon = isGetOnly ? ScanSearch : Send;
  const sendLabel = isGetOnly ? "Cari IHS" : "Kirim";

  useEffect(() => {
    const t = setTimeout(() => { setQuery(q.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const ac = new AbortController();
    listPrereqItems(jenis, { q: query || undefined, status, page, pageSize: PAGE_SIZE }, ac.signal)
      .then((d) => { if (!ac.signal.aborted) setData(d); })
      .catch((e) => { if (!isAbort(e)) toast.error(`Gagal memuat data ${resource}`, errMsg(e)); });
    return () => ac.abort();
  }, [jenis, resource, query, status, page, refreshKey, reload]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const kodeLabel = jenis === "practitioner" ? "NIP" : jenis === "patient" ? "No. RM" : "Kode";

  return (
    <SectionCard
      title={`Data ${resource}`}
      desc={data ? `${data.total.toLocaleString("id-ID")} data lokal · Detail menampilkan data mentah & payload FHIR` : "Memuat…"}
      action={<Button variant="ghost" onClick={onClose}>Tutup</Button>}
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-3">
        <div className="relative min-w-48 flex-1">
          <label htmlFor={searchId} className="sr-only">Cari {kodeLabel} atau nama {resource}</label>
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            id={searchId}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Cari ${kodeLabel} atau nama…`}
            autoComplete="off"
            className={cn("w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none transition placeholder:text-slate-400", FHIR_ACCENT.focus)}
          />
        </div>
        <fieldset className="flex items-center gap-2">
          <legend className="sr-only">Filter status peta</legend>
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
            {STATUS_OPTS.map((o) => (
              <label key={o.value} className="relative">
                <input
                  type="radio"
                  name={`${searchId}-status`}
                  value={o.value}
                  checked={status === o.value}
                  onChange={() => { setStatus(o.value); setPage(1); }}
                  className="peer sr-only"
                />
                <span className="inline-flex h-7 cursor-pointer items-center rounded-md px-2.5 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900 peer-checked:bg-white peer-checked:text-teal-800 peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-teal-600">
                  {o.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {!data ? <SkeletonRows rows={6} /> : data.rows.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={query || status !== "semua" ? "Tidak ada yang cocok" : `Belum ada data ${resource} lokal`}
          desc={query || status !== "semua" ? "Ubah kata kunci atau filter." : undefined}
        />
      ) : (
        <div
          tabIndex={0}
          role="region"
          aria-labelledby={`${searchId}-caption`}
          className={cn(tableWrap, "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-600")}
        >
          <table className={tableCls}>
            <caption id={`${searchId}-caption`} className="sr-only">
              Data {resource} lokal dan status peta IHS, halaman {page} dari {pages}
            </caption>
            <thead>
              <tr>
                <th scope="col" className={cn(thCls, "w-10 text-right")}>No.</th>
                <th scope="col" className={thCls}>{kodeLabel}</th>
                <th scope="col" className={thCls}>Nama</th>
                <th scope="col" className={thCls}>Status</th>
                <th scope="col" className={thCls}>IHS id</th>
                <th scope="col" className={thCls}>Sinkron</th>
                <th scope="col" className={thCls}><span className="sr-only">Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r, i) => (
                <tr key={r.localId} className={trCls}>
                  <td className={cn(tdCls, "text-right font-mono text-[11px] tabular-nums text-slate-400")}>
                    {(data.page - 1) * data.pageSize + i + 1}
                  </td>
                  <td className={cn(tdCls, "font-mono text-[11px] text-slate-500")}>{r.kode}</td>
                  <th scope="row" className={cn(tdCls, "text-left font-normal")}>
                    <span className="block font-medium text-slate-800">{r.nama}</span>
                    {r.sub && <span className="block text-[11px] text-slate-400">{r.sub}</span>}
                  </th>
                  <td className={tdCls}>
                    {r.ihsId ? <Pill label="Terpetakan" tone="emerald" /> : <Pill label={r.aktif ? "Belum" : "Nonaktif"} tone={r.aktif ? "amber" : "slate"} />}
                  </td>
                  <td className={cn(tdCls, "font-mono text-[11px]")}>{r.ihsId ? <IdChip value={r.ihsId} /> : "—"}</td>
                  <td className={cn(tdCls, "whitespace-nowrap text-slate-500")}>{r.lastSyncAt ? fmtRelative(r.lastSyncAt) : "—"}</td>
                  <td className={cn(tdCls, "text-right")}>
                    <div className="inline-flex items-center gap-1.5">
                      {canSend && (
                        <Button
                          variant="secondary"
                          icon={SendIcon}
                          loading={isBusy(r.localId)}
                          onClick={() => void send(r.localId, r.nama)}
                          title={isGetOnly ? "Cari IHS id data ini di SatuSehat (GET by NIK)" : "Kirim data ini ke SatuSehat (POST baru / PUT bila berubah)"}
                        >
                          {isBusy(r.localId) ? (isGetOnly ? "Mencari…" : "Mengirim…") : sendLabel}
                          <span className="sr-only"> {r.nama}</span>
                        </Button>
                      )}
                      <Button variant="secondary" onClick={() => setOpenId(r.localId)}>
                        Detail<span className="sr-only"> {r.nama}</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && pages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
          <span>Halaman {page} dari {pages}</span>
          <div className="flex gap-1">
            <Button variant="secondary" icon={ChevronLeft} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Sebelumnya</Button>
            <Button variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              Berikutnya <ChevronRight size={13} aria-hidden />
            </Button>
          </div>
        </div>
      )}

      <PrereqDetailDrawer jenis={jenis} localId={openId} onClose={() => setOpenId(null)} canSend={canSend} onSent={afterSend} />
    </SectionCard>
  );
}
