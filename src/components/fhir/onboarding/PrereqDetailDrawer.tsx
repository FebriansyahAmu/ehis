"use client";

// Drawer detail mentah 1 data Prerequisites. Tab:
//   Ringkasan  — status peta IHS, versi, hash, request SatuSehat, catatan
//   Data lokal — baris master RS apa adanya (JSON, NIK dimasker)
//   Payload FHIR — Organization/Location: payload sinkron; Practitioner/Patient: representasi profil
//                  SATUSEHAT dari data lokal (tidak dikirim) + request GET by NIK
//   Log pengiriman — riwayat panggilan SatuSehat untuk data ini (request & response tercatat)
// shadcn Sheet (Radix Dialog): focus trap, Esc, klik luar, judul = SheetTitle.

import { useCallback, useEffect, useState } from "react";
import { CircleCheck, CircleX, Info, RefreshCw, ScanSearch, Send, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPrereqItem, type PrereqItemDetailDTO, type PrereqJenis } from "@/lib/api/fhir/onboarding";
import { Button, Pill, SkeletonRows, TONE_SOFT, errMsg, isAbort } from "../fhirShared";
import { useSendPrereqItem, type SendNotice, type SendTone } from "./useSendPrereqItem";
import { PAYLOAD_STATUS, groupTone, metaOf } from "../resource/resourceCatalog";
import { Callout, CopyButton, IdChip, JsonView, PayloadStatusPill } from "../resource/resourceUi";
import { fmtDateTime } from "../resource/resourceTime";
import { SendLogPanel } from "../log/SendLogPanel";

type Tab = "ringkasan" | "lokal" | "fhir" | "log";

export const PREREQ_RESOURCE: Record<PrereqJenis, string> = {
  organization: "Organization",
  location: "Location",
  practitioner: "Practitioner",
  patient: "Patient",
};

/** Tab garis bawah beraksen modul (`--ui-primary` dari data-accent pada SheetContent). */
const TAB_TRIGGER = "flex-none px-3 text-xs font-semibold data-[state=active]:text-primary after:bg-primary";

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 min-w-0 truncate text-xs text-slate-700">{children}</dd>
    </div>
  );
}

/**
 * Kaki drawer: kirim item ini. Organization/Location → "Kirim" (POST baru / PUT bila berubah) +
 * "Kirim ulang" (PUT paksa walau identik). Practitioner/Patient → "Cari IHS" (GET by NIK; bila sudah
 * terpetakan = cari ulang). Root RS / data tanpa NIK → tak ada request → tombol nonaktif + alasan.
 */
const NOTICE_TONE: Record<SendTone, { tone: "emerald" | "sky" | "amber" | "rose"; icon: LucideIcon }> = {
  success: { tone: "emerald", icon: CircleCheck },
  info: { tone: "sky", icon: Info },
  warning: { tone: "amber", icon: TriangleAlert },
  error: { tone: "rose", icon: CircleX },
};

/** Alert hasil kirim di dalam drawer. Gagal = role alert (diumumkan segera); lainnya = status (sopan). */
function SendNoticeBanner({ notice, onDismiss }: { notice: SendNotice; onDismiss: () => void }) {
  const cfg = NOTICE_TONE[notice.tone];
  const Icon = cfg.icon;
  return (
    <div
      role={notice.tone === "error" ? "alert" : "status"}
      className={cn("flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-xs leading-relaxed", TONE_SOFT[cfg.tone])}
    >
      <Icon size={15} className="mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{notice.title}</p>
        {notice.message && <p className="mt-0.5 wrap-break-word opacity-90">{notice.message}</p>}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Tutup notifikasi"
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md opacity-70 outline-none transition hover:bg-white/60 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-current"
      >
        <X size={13} aria-hidden />
      </button>
    </div>
  );
}

function SendFooter({ jenis, d, busy, notice, onDismiss, onSend }: {
  jenis: PrereqJenis;
  d: PrereqItemDetailDTO;
  busy: boolean;
  notice: SendNotice | null;
  onDismiss: () => void;
  onSend: (force: boolean) => void;
}) {
  const getOnly = jenis === "practitioner" || jenis === "patient";
  const isRoot = jenis === "organization" && !d.request;
  const blocked = getOnly && !d.request;
  const hint = isRoot
    ? d.map ? "Root RS sudah dipetakan ke Organization ID DevHub — tak perlu dikirim." : "Root RS dipetakan ke Organization ID DevHub (tanpa panggilan)."
    : blocked ? "Tanpa NIK valid — belum bisa dicari di SatuSehat."
    : getOnly ? (d.map ? "Cari ulang IHS id dengan GET by NIK." : "Cari IHS id dengan GET by NIK.")
    : d.map ? (d.payloadStatus === "changed" ? "Data berubah — kirim PUT untuk menyelaraskan." : "Sudah terkirim. \"Kirim ulang\" memaksa PUT walau identik.")
    : "Belum terdaftar — kirim untuk mendaftarkan (cari dulu, POST bila belum ada).";

  return (
    <SheetFooter className="mt-0 flex-row flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3">
      {notice && <SendNoticeBanner notice={notice} onDismiss={onDismiss} />}
      <p className="min-w-0 flex-1 text-[11px] text-slate-500">{hint}</p>
      <div className="flex items-center gap-2">
        {!getOnly && !isRoot && d.map && (
          <Button variant="secondary" icon={RefreshCw} loading={busy} onClick={() => onSend(true)}>Kirim ulang</Button>
        )}
        {!(isRoot && d.map) && (
          <Button
            icon={getOnly ? ScanSearch : Send}
            loading={busy}
            disabled={blocked}
            onClick={() => onSend(getOnly && !!d.map)}
          >
            {busy ? (getOnly ? "Mencari…" : "Mengirim…") : getOnly ? (d.map ? "Cari ulang IHS" : "Cari IHS") : isRoot ? "Petakan root" : "Kirim item ini"}
          </Button>
        )}
      </div>
    </SheetFooter>
  );
}

export function PrereqDetailDrawer({
  jenis,
  localId,
  onClose,
  canSend = false,
  onSent,
}: {
  jenis: PrereqJenis;
  localId: string | null;
  onClose: () => void;
  /** Izin `fhir.sync:create` — tombol kirim item di kaki drawer. */
  canSend?: boolean;
  /** Setelah kirim (mis. segarkan baris daftar + ringkasan). */
  onSent?: () => void;
}) {
  const [tab, setTab] = useState<Tab>("ringkasan");
  // Hasil disimpan beserta id-nya: saat menutup, isi lama tetap tampil selama animasi keluar.
  const [loaded, setLoaded] = useState<{ id: string; d: PrereqItemDetailDTO | null; error: string | null } | null>(null);
  // Naik setiap item dikirim → detail (status/IHS/hash) & log pengiriman dimuat ulang.
  const [version, setVersion] = useState(0);

  const afterSend = useCallback(() => {
    setVersion((v) => v + 1);
    onSent?.();
  }, [onSent]);
  // Drawer = dialog modal → hasil kirim ditampilkan inline di dalamnya (toast di luar modal tak terbaca).
  const { send, isBusy, noticeFor, clearNotice } = useSendPrereqItem(jenis, afterSend, { mode: "inline" });

  useEffect(() => {
    if (!localId) return;
    const ac = new AbortController();
    getPrereqItem(jenis, localId, ac.signal)
      .then((d) => { if (!ac.signal.aborted) setLoaded({ id: localId, d, error: null }); })
      .catch((e) => { if (!isAbort(e)) setLoaded({ id: localId, d: null, error: errMsg(e) ?? "Gagal memuat detail" }); });
    return () => ac.abort();
  }, [jenis, localId, version]);

  const current = localId ? (loaded?.id === localId ? loaded : null) : loaded;
  const d = current?.d ?? null;
  const error = current?.error ?? null;
  const loading = !!localId && !current;

  const resourceType = PREREQ_RESOURCE[jenis];
  const m = metaOf(resourceType);
  const Icon = m.icon;
  const isGetOnly = jenis === "practitioner" || jenis === "patient";
  const fhirValue = d?.payload ?? null;
  const state = loading ? <SkeletonRows rows={6} /> : error ? <Callout tone="rose" icon={TriangleAlert}>{error}</Callout> : null;
  // Tab payload/request tak bermakna bila kosong (mis. root RS, pasien tanpa NIK) → jatuh ke Ringkasan.
  const activeTab: Tab = tab === "fhir" && d && !fhirValue ? "ringkasan" : tab;

  return (
    <Sheet open={!!localId} onOpenChange={(o) => { if (!o) { onClose(); setTab("ringkasan"); clearNotice(); } }}>
      <SheetContent side="right" showCloseButton={false} data-accent="teal" className="w-full gap-0 p-0 sm:max-w-2xl">
        <SheetHeader className="flex-row items-start gap-3 border-b border-slate-100 px-5 py-4">
          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", TONE_SOFT[groupTone(m.group)])}>
            <Icon size={18} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-slate-400">
              <span className="uppercase tracking-widest">{resourceType}</span> · {m.desc}
            </p>
            <SheetTitle className="mt-0.5 truncate text-base font-bold text-slate-900">{d?.nama ?? "Memuat…"}</SheetTitle>
            <SheetDescription className="truncate font-mono text-xs text-slate-500">{d?.kode ?? " "}</SheetDescription>
            {d && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Pill label={d.map ? "Terpetakan" : "Belum terpetakan"} tone={d.map ? "emerald" : "amber"} />
                {d.payloadStatus && <PayloadStatusPill status={d.payloadStatus} />}
              </div>
            )}
          </div>
          <SheetClose
            aria-label="Tutup"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition outline-none hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X size={16} aria-hidden />
          </SheetClose>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(v) => setTab(v as Tab)} className="min-h-0 flex-1 gap-0">
          <div className="border-b border-slate-100 px-5">
            <TabsList variant="line" aria-label="Tampilan detail">
              <TabsTrigger value="ringkasan" className={TAB_TRIGGER}>Ringkasan</TabsTrigger>
              <TabsTrigger value="lokal" className={TAB_TRIGGER}>Data lokal</TabsTrigger>
              <TabsTrigger value="fhir" disabled={!fhirValue} className={TAB_TRIGGER}>Payload FHIR</TabsTrigger>
              <TabsTrigger value="log" className={TAB_TRIGGER}>Log pengiriman</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="ringkasan" className="min-h-0 overflow-y-auto px-5 py-4">
            {state ?? (d && (
              <div className="flex flex-col gap-4">
                {d.payloadStatus && (
                  <Callout tone={PAYLOAD_STATUS[d.payloadStatus].tone} icon={Info}>{PAYLOAD_STATUS[d.payloadStatus].hint}.</Callout>
                )}
                {d.payloadNote && <Callout tone="slate" icon={Info}>{d.payloadNote}</Callout>}

                <dl className="grid grid-cols-1 gap-x-4 gap-y-2.5 rounded-xl border border-slate-200 p-3 sm:grid-cols-2">
                  <Meta label="IHS id">{d.map ? <IdChip value={d.map.ihsId} /> : "— (belum terpetakan)"}</Meta>
                  <Meta label="ID lokal"><IdChip value={d.localId} /></Meta>
                  <Meta label="Versi SatuSehat">{d.map?.versionId ?? "—"}</Meta>
                  <Meta label="Sinkron terakhir">{d.map ? fmtDateTime(d.map.lastSyncAt) : "—"}</Meta>
                  <Meta label="Hash payload">
                    {d.map?.hash ? <code className="font-mono text-[11px]">{d.map.hash.slice(0, 16)}…</code> : "—"}
                  </Meta>
                </dl>

                {d.request && (
                  <div>
                    <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {isGetOnly ? "Request pencarian" : d.map ? "Request berikutnya (bila berubah)" : "Request pendaftaran"}
                    </h3>
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <Pill label={d.request.method} tone={d.request.method === "GET" ? "teal" : "sky"} />
                      <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-700">{d.request.path}</code>
                      <CopyButton text={`${d.request.method} ${d.request.path}`} label="Salin" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="lokal" className="min-h-0 overflow-y-auto px-5 py-4">
            {state ?? (d && (
              <div className="flex flex-col gap-2">
                <p className="text-[11px] text-slate-500">Baris master RS yang menjadi sumber {resourceType} (NIK dimasker).</p>
                <JsonView value={d.local} />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="fhir" className="min-h-0 overflow-y-auto px-5 py-4">
            {state ?? (fhirValue ? (
              <div className="flex flex-col gap-2">
                {isGetOnly ? (
                  <Callout tone="sky" icon={Info}>
                    Representasi <b>{resourceType}</b> menurut profil SATUSEHAT, disusun dari data lokal (NIK dimasker).
                    Resource ini <b>tidak dikirim</b> — RS hanya mencari IHS id dengan request GET di bawah.
                  </Callout>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Dibangun dari data terkini dengan builder yang sama dengan sinkron (tidak disimpan).
                  </p>
                )}
                {isGetOnly && d?.request && (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <Pill label={d.request.method} tone="teal" />
                    <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-700">{d.request.path}</code>
                  </div>
                )}
                <JsonView value={fhirValue} />
              </div>
            ) : null)}
          </TabsContent>

          {/* Konten tab tak dirender saat tak aktif → log baru diambil ketika tab dibuka. */}
          <TabsContent value="log" className="min-h-0 overflow-y-auto px-5 py-4">
            {localId && (
              <SendLogPanel
                key={`${localId}|${version}`}
                target={{ localType: resourceType, localId }}
                emptyHint={
                  !d || d.request ? undefined
                  : jenis === "organization" ? "Root RS dipetakan langsung ke Organization ID DevHub — tidak pernah dikirim, jadi tak ada panggilan."
                  : isGetOnly ? "Tanpa NIK valid — data ini belum bisa dicari di SatuSehat, jadi belum ada panggilan."
                  : undefined
                }
              />
            )}
          </TabsContent>
        </Tabs>

        {canSend && d && localId && (
          <SendFooter
            jenis={jenis}
            d={d}
            busy={isBusy(localId)}
            notice={noticeFor(localId)}
            onDismiss={clearNotice}
            onSend={(force) => void send(localId, d.nama, { force })}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
