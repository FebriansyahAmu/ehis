"use client";

// Kartu resource milik 1 kunjungan, dikelompokkan per kategori + filter status kirim. Tiap kartu bisa
// dikirim sendiri ("kirim satu per satu") di samping "Kirim semua" (Bundle) di hero halaman.
// Kartu = <article>: judul berupa tombol pembuka drawer yang area kliknya direntangkan ke seluruh
// kartu (::after), aksi kirim = tombol terpisah di <footer> (di atas overlay, selalu terlihat).

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Inbox, Unlink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EncounterResourceDTO, PayloadStatus, ResourceRowDTO } from "@/lib/api/fhir/resources";
import { EmptyState, SectionCard, TONE_SOFT, type Tone } from "../fhirShared";
import { GROUPS, PAYLOAD_STATUS, groupTone, metaOf, summarize } from "../resource/resourceCatalog";
import { IdChip, PayloadStatusPill, ResourceDrawer } from "../resource/resourceUi";
import { ResourceDetailDrawer } from "../resource/FhirResources";
import { fmtDateTime, fmtRelative } from "../resource/resourceTime";
import { SendLogPanel } from "../log/SendLogPanel";
import { CardSendAction, DrawerSendFooter } from "./EncounterItemSend";
import { itemKey, useSendEncounterItem } from "./useSendEncounterItem";

const FILTERS: (PayloadStatus | "")[] = ["", "new", "changed", "synced"];
const TONE_DOT: Record<Tone, string> = {
  teal: "bg-teal-500", emerald: "bg-emerald-500", amber: "bg-amber-500", rose: "bg-rose-500", sky: "bg-sky-500", slate: "bg-slate-400",
};
const STATUS_RING: Record<PayloadStatus, string> = {
  synced: "border-emerald-200",
  changed: "border-amber-300",
  new: "border-dashed border-sky-300",
};

export function EncounterResourceGrid({ kunjunganId, resources, orphans, counts, canSend = false, sendLocked = false, onSent, onBusyChange }: {
  /** Kunjungan pemilik — log resource klinis ikut menampilkan Bundle transaction yang memuatnya. */
  kunjunganId: string;
  resources: EncounterResourceDTO[];
  orphans: ResourceRowDTO[];
  counts: Record<PayloadStatus, number>;
  /** Izin `fhir.sync:create` & kunjungan layak dikirim — tampilkan aksi kirim per resource. */
  canSend?: boolean;
  /** "Kirim semua" sedang berjalan → kirim per resource dinonaktifkan sementara. */
  sendLocked?: boolean;
  /** Setelah resource diterima SatuSehat → muat ulang detail (status kartu & progres). */
  onSent?: () => void;
  /** Ada kirim per resource yang sedang berjalan → hero menonaktifkan "Kirim semua". */
  onBusyChange?: (busy: boolean) => void;
}) {
  const [filter, setFilter] = useState<PayloadStatus | "">("");
  // Snapshot item terpilih dipertahankan saat drawer menutup → animasi keluar tak berkedip kosong;
  // selama terbuka dibaca versi TERKINI dari `resources` (status berubah sesudah kirim).
  const [selected, setSelected] = useState<EncounterResourceDTO | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orphanId, setOrphanId] = useState<string | null>(null);
  const { send, busy, notice, dismiss, version } = useSendEncounterItem(kunjunganId, onSent);
  const current = selected ? (resources.find((r) => itemKey(r) === itemKey(selected)) ?? selected) : null;
  const anyBusy = busy.size > 0;

  useEffect(() => { onBusyChange?.(anyBusy); }, [anyBusy, onBusyChange]);

  const nameOf = (r: EncounterResourceDTO) => `${metaOf(r.resourceType).label} · ${summarize(r.resourceType, r.payload).title}`;

  const shown = useMemo(() => (filter ? resources.filter((r) => r.status === filter) : resources), [resources, filter]);
  const byGroup = useMemo(() => {
    const m = new Map<string, EncounterResourceDTO[]>();
    for (const r of shown) {
      const g = metaOf(r.resourceType).group;
      m.set(g, [...(m.get(g) ?? []), r]);
    }
    return m;
  }, [shown]);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter status kirim">
        {FILTERS.map((f) => {
          const n = f ? counts[f] : resources.length;
          const active = filter === f;
          return (
            <button
              key={f || "all"}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-teal-300",
                active ? "border-teal-600 bg-teal-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
              )}
            >
              {f ? PAYLOAD_STATUS[f].short : "Semua"}
              <span className={cn("rounded-full px-1.5 text-[10.5px] tabular-nums", active ? "bg-white/20" : "bg-slate-100 text-slate-500")}>{n}</span>
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <EmptyState icon={Inbox} title={resources.length ? "Tidak ada resource dengan status ini" : "Belum ada resource"} desc={resources.length ? undefined : "Resource dibangun setelah kunjungan diterima dan data klinis diisi."} />
        </div>
      ) : (
        GROUPS.filter((g) => byGroup.has(g.key)).map((g) => (
          <section key={g.key} className="flex flex-col gap-2" aria-label={g.label}>
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              <span className={cn("h-2 w-2 rounded-full", TONE_DOT[g.tone])} aria-hidden />
              {g.label}
              <span className="font-medium normal-case tracking-normal text-slate-400">{byGroup.get(g.key)!.length}</span>
            </h3>
            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 2xl:grid-cols-3">
              {byGroup.get(g.key)!.map((r, i) => (
                <motion.li key={itemKey(r)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16, delay: Math.min(i * 0.02, 0.15) }}>
                  <ResourceCard
                    r={r}
                    onOpen={() => { setSelected(r); setDrawerOpen(true); }}
                    action={canSend ? (
                      <CardSendAction
                        r={r}
                        name={nameOf(r)}
                        busy={busy.has(itemKey(r))}
                        disabled={sendLocked || anyBusy}
                        onSend={() => void send(r, nameOf(r))}
                      />
                    ) : null}
                  />
                </motion.li>
              ))}
            </ul>
          </section>
        ))
      )}

      {orphans.length > 0 && (
        <SectionCard title="Terpetakan, tak lagi dibangun" desc="Pernah terkirim, tetapi data sumbernya sudah dihapus/diganti — tidak ikut job berikutnya">
          <ul className="divide-y divide-slate-100">
            {orphans.map((o) => (
              <li key={o.id}>
                <button type="button" onClick={() => setOrphanId(o.id)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs transition hover:bg-slate-50">
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <Unlink size={13} className="shrink-0 text-slate-400" aria-hidden />
                    <span className="font-semibold text-slate-700">{metaOf(o.resourceType).label}</span>
                    <code className="truncate font-mono text-[11px] text-slate-400">{o.ihsId}</code>
                  </span>
                  <span className="shrink-0 text-slate-400">{fmtRelative(o.lastSyncAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <ResourceDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        resourceType={current?.resourceType ?? "Resource"}
        status={current?.status ?? null}
        payload={current?.payload ?? null}
        meta={current ? [
          { label: "IHS id", value: <IdChip value={current.ihsId} muted="belum ada — dibuat saat dikirim" /> },
          { label: "ID lokal", value: <IdChip value={current.localId} /> },
          { label: "Sumber lokal", value: current.localType },
          { label: "Versi SatuSehat", value: current.versionId ?? "—" },
          { label: "Sinkron terakhir", value: fmtDateTime(current.lastSyncAt) },
        ] : []}
        footer={current && canSend ? (
          <DrawerSendFooter
            r={current}
            busy={busy.has(itemKey(current))}
            disabled={sendLocked || anyBusy}
            notice={notice?.key === itemKey(current) ? notice.n : null}
            onDismiss={dismiss}
            onSend={() => void send(current, nameOf(current), { inline: true })}
          />
        ) : null}
        logPanel={current ? (
          <SendLogPanel
            key={`${itemKey(current)}|${version}`}
            target={{ localType: current.localType, localId: current.localId, kunjunganId }}
          />
        ) : null}
      />
      <ResourceDetailDrawer id={orphanId} onClose={() => setOrphanId(null)} />
    </div>
  );
}

function ResourceCard({ r, onOpen, action }: { r: EncounterResourceDTO; onOpen: () => void; action: React.ReactNode }) {
  const m = metaOf(r.resourceType);
  const s = summarize(r.resourceType, r.payload);
  const Icon = m.icon;
  return (
    <article
      className={cn(
        "relative flex h-full w-full flex-col gap-2.5 rounded-2xl border bg-white p-3.5 shadow-sm transition",
        // Hover/fokus digambar di kartu (bukan di tombol judul yang direntangkan).
        "has-[.card-open:hover]:-translate-y-0.5 has-[.card-open:hover]:shadow-md",
        "has-[.card-open:focus-visible]:ring-2 has-[.card-open:focus-visible]:ring-teal-300",
        STATUS_RING[r.status],
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", TONE_SOFT[groupTone(m.group)])}>
          <Icon size={16} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">{m.label}</p>
          <h4 className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-800">
            {/* Klik di mana pun pada kartu = buka detail: ::after merentang ke seluruh <article>. */}
            <button
              type="button"
              onClick={onOpen}
              className="card-open text-left outline-none after:absolute after:inset-0 after:rounded-2xl after:content-['']"
            >
              {s.title}
            </button>
          </h4>
        </div>
        <PayloadStatusPill status={r.status} short />
      </div>
      {s.subtitle && <p className="line-clamp-2 text-[11.5px] text-slate-500">{s.subtitle}</p>}
      {s.chips.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {s.chips.slice(0, 4).map((c) => (
            <span key={c} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-medium text-slate-600">{c}</span>
          ))}
        </div>
      )}
      <footer className="mt-auto flex flex-col gap-2 border-t border-slate-100 pt-2 text-[10.5px] text-slate-400">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate">{s.when ?? m.type}</span>
          <span className="shrink-0">{r.ihsId ? `IHS …${r.ihsId.slice(-6)}` : "belum ada IHS"}</span>
        </div>
        {action && <div className="flex min-w-0 items-center justify-end">{action}</div>}
      </footer>
    </article>
  );
}
