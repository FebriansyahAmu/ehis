"use client";

// Drawer detail mentah 1 data Prerequisites. Tab:
//   Ringkasan  — status peta IHS, versi, hash, request SatuSehat, catatan
//   Data lokal — baris master RS apa adanya (JSON, NIK dimasker)
//   Payload FHIR — Organization/Location: payload sinkron; Practitioner/Patient: representasi profil
//                  SATUSEHAT dari data lokal (tidak dikirim) + request GET by NIK
// shadcn Sheet (Radix Dialog): focus trap, Esc, klik luar, judul = SheetTitle.

import { useEffect, useState } from "react";
import { Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPrereqItem, type PrereqItemDetailDTO, type PrereqJenis } from "@/lib/api/fhir/onboarding";
import { Pill, SkeletonRows, TONE_SOFT, errMsg, isAbort } from "../fhirShared";
import { PAYLOAD_STATUS, groupTone, metaOf } from "../resource/resourceCatalog";
import { Callout, CopyButton, IdChip, JsonView, PayloadStatusPill } from "../resource/resourceUi";
import { fmtDateTime } from "../resource/resourceTime";

type Tab = "ringkasan" | "lokal" | "fhir";

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

export function PrereqDetailDrawer({
  jenis,
  localId,
  onClose,
}: {
  jenis: PrereqJenis;
  localId: string | null;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("ringkasan");
  // Hasil disimpan beserta id-nya: saat menutup, isi lama tetap tampil selama animasi keluar.
  const [loaded, setLoaded] = useState<{ id: string; d: PrereqItemDetailDTO | null; error: string | null } | null>(null);

  useEffect(() => {
    if (!localId) return;
    const ac = new AbortController();
    getPrereqItem(jenis, localId, ac.signal)
      .then((d) => { if (!ac.signal.aborted) setLoaded({ id: localId, d, error: null }); })
      .catch((e) => { if (!isAbort(e)) setLoaded({ id: localId, d: null, error: errMsg(e) ?? "Gagal memuat detail" }); });
    return () => ac.abort();
  }, [jenis, localId]);

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
    <Sheet open={!!localId} onOpenChange={(o) => { if (!o) { onClose(); setTab("ringkasan"); } }}>
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
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
