"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pill, User, AlertCircle, X, ChevronDown, ChevronRight,
  Copy, Check, Clock, Stethoscope, Send,
} from "lucide-react";
import type { RawatInapPatientDetail, ResepRIItem } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  SIGNA_OPTIONS, ATURAN_WAKTU, RUTE_OPTIONS, DEPO_OPTIONS, ATURAN_PANDUAN,
  KATEGORI_BADGE, genResepId, todayISO, fmtTanggalRI, type ObatCatalog,
} from "@/components/shared/resep/resepShared";
import ObatSearch   from "@/components/shared/resep/ObatSearch";
import ResepItemRow from "@/components/shared/resep/ResepItemRow";

// ── Types ─────────────────────────────────────────────────

interface Props {
  patient:       RawatInapPatientDetail;
  items:         ResepRIItem[];                  // confirmed/sent orders — riwayat + MAR source
  onSend:        (draft: ResepRIItem[]) => void; // send draft → confirmed
  onToggleAktif: (id: string) => void;           // toggle aktif on confirmed items
}

interface RiwayatGroup {
  key:     string;
  tanggal: string;
  dokter:  string;
  items:   ResepRIItem[];
}

const EMPTY_FORM = {
  namaObat:    "",
  kodeObat:    "",
  dosis:       "",
  signa:       "1×1"                as string,
  aturanPakai: "AC (Sebelum Makan)" as string,
  rute:        "Oral"               as string,
  jumlah:      1,
  durasiHari:  7,
  keterangan:  "",
  kategori:    "Reguler"            as ResepRIItem["kategori"],
};

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      {children}{required && <span className="ml-0.5 text-rose-400">*</span>}
    </p>
  );
}

// ── Grouping ──────────────────────────────────────────────

function buildGroups(items: ResepRIItem[]): RiwayatGroup[] {
  const map = new Map<string, RiwayatGroup>();
  items.forEach((item) => {
    const key = `${item.tanggalOrder}||${item.dokterPj}`;
    if (!map.has(key)) {
      map.set(key, { key, tanggal: item.tanggalOrder, dokter: item.dokterPj, items: [] });
    }
    map.get(key)!.items.push(item);
  });
  return Array.from(map.values()).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

// ── Riwayat section ───────────────────────────────────────

function RiwayatSection({
  groups, copiedIds, onCopy, onCopyAll,
}: {
  groups:    RiwayatGroup[];
  copiedIds: Set<string>;
  onCopy:    (item: ResepRIItem) => void;
  onCopyAll: (items: ResepRIItem[]) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(groups[0]?.key ? [groups[0].key] : []),
  );

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  if (groups.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Section header */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        <Clock size={13} className="text-slate-400" />
        <p className="text-xs font-semibold text-slate-700">Riwayat Order Obat</p>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
          {groups.length} tanggal
        </span>
      </div>

      <div className="divide-y divide-slate-50">
        {groups.map((group) => {
          const open       = expanded.has(group.key);
          const allCopied  = group.items.every((it) => copiedIds.has(it.id));
          const someCopied = !allCopied && group.items.some((it) => copiedIds.has(it.id));
          const uncopied   = group.items.filter((it) => !copiedIds.has(it.id));

          return (
            <div key={group.key}>
              {/* Group row */}
              <div className="flex items-center gap-2 px-4 py-2.5 transition hover:bg-slate-50">
                <button
                  type="button"
                  onClick={() => toggle(group.key)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span className="shrink-0 text-slate-400">
                    {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-xs font-semibold text-slate-700">
                      {fmtTanggalRI(group.tanggal)}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Stethoscope size={10} />{group.dokter}
                    </span>
                  </div>
                </button>

                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">{group.items.length} obat</span>
                  <button
                    type="button"
                    onClick={() => !allCopied && onCopyAll(uncopied)}
                    disabled={allCopied}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition",
                      allCopied
                        ? "cursor-default bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                        : someCopied
                          ? "border border-indigo-300 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                          : "border border-slate-200 text-slate-500 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600",
                    )}
                  >
                    {allCopied
                      ? <><Check size={10} /> Semua Disalin</>
                      : someCopied
                        ? <><Copy size={10} /> Salin Sisanya ({uncopied.length})</>
                        : <><Copy size={10} /> Salin Semua ({group.items.length})</>
                    }
                  </button>
                </div>
              </div>

              {/* Animated items panel */}
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    key="items"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-slate-50 bg-slate-50/40 px-4 pb-3 pt-2">
                      <div className="flex flex-col gap-2">
                        {group.items.map((item) => {
                          const copied = copiedIds.has(item.id);
                          return (
                            <div key={item.id}
                              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-400">
                                <Pill size={11} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <p className="text-xs font-semibold text-slate-800">{item.namaObat}</p>
                                  <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", KATEGORI_BADGE[item.kategori])}>
                                    {item.kategori}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  {item.dosis}
                                  <span className="mx-1 text-slate-300">·</span>
                                  <span className="font-semibold text-indigo-600">{item.signa}</span>
                                  <span className="mx-1 text-slate-300">·</span>
                                  {item.aturanPakai}
                                  <span className="mx-1 text-slate-300">·</span>
                                  {item.rute}
                                  <span className="mx-1 text-slate-300">·</span>
                                  <span className="font-medium text-slate-600">×{item.jumlah}</span>
                                  {item.keterangan && (
                                    <span className="ml-1 italic text-slate-400">({item.keterangan})</span>
                                  )}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => !copied && onCopy(item)}
                                disabled={copied}
                                className={cn(
                                  "flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition",
                                  copied
                                    ? "cursor-default bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                                    : "border border-slate-200 text-slate-500 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600",
                                )}
                              >
                                {copied
                                  ? <><Check size={10} /> Disalin</>
                                  : <><Copy size={10} /> Salin ke Resep</>
                                }
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────

export default function ResepPane({ patient, items, onSend, onToggleAktif }: Props) {
  const [form,       setForm]       = useState({ ...EMPTY_FORM });
  const [depo,       setDepo]       = useState<string>("Depo Rawat Inap");
  const [showGuide,  setShowGuide]  = useState(false);
  const [draftItems,     setDraftItems]     = useState<ResepRIItem[]>([]);
  const [draftSourceMap, setDraftSourceMap] = useState<Map<string, string>>(new Map()); // draftId → sourceRiwayatId

  // Derived: a riwayat item is "copied" only if a draft that came from it still exists
  const copiedIds = new Set(draftSourceMap.values());

  // Riwayat + stopped items are derived from confirmed (parent) items only
  const riwayatGroups = buildGroups(items);
  const stoppedItems  = items.filter((i) => !i.aktif);

  function setField<K extends keyof typeof EMPTY_FORM>(k: K, v: (typeof EMPTY_FORM)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function selectObat(obat: ObatCatalog) {
    setForm((p) => ({
      ...p,
      namaObat: obat.nama,
      kodeObat: obat.kode,
      dosis:    `${obat.dosis} ${obat.satuan}`,
      kategori: obat.kategori,
    }));
  }

  function clearObat() { setForm({ ...EMPTY_FORM }); }

  // Draft handlers — local only, never touch parent items
  function addDraft(item: ResepRIItem)     { setDraftItems((p) => [item, ...p]); }
  function editDraft(updated: ResepRIItem) { setDraftItems((p) => p.map((i) => i.id === updated.id ? updated : i)); }

  function removeDraft(id: string) {
    setDraftItems((p) => p.filter((i) => i.id !== id));
    setDraftSourceMap((m) => { const n = new Map(m); n.delete(id); return n; });
  }

  function handleSubmit() {
    if (!form.namaObat) return;
    addDraft({
      id: genResepId(), ...form,
      tanggalOrder: todayISO(),
      dokterPj:     patient.dpjp,
      aktif:        true,
    });
    setForm({ ...EMPTY_FORM });
  }

  function copyItem(src: ResepRIItem) {
    const newId = genResepId();
    addDraft({
      id:           newId,
      namaObat:     src.namaObat,
      kodeObat:     src.kodeObat,
      dosis:        src.dosis,
      signa:        src.signa,
      jumlah:       src.jumlah,
      rute:         src.rute,
      aturanPakai:  src.aturanPakai,
      kategori:     src.kategori,
      keterangan:   src.keterangan,
      durasiHari:   src.durasiHari,
      tanggalOrder: todayISO(),
      dokterPj:     patient.dpjp,
      aktif:        true,
    });
    setDraftSourceMap((m) => new Map(m).set(newId, src.id));
  }

  function copyAll(srcItems: ResepRIItem[]) { srcItems.forEach(copyItem); }

  function handleSend() {
    if (draftItems.length === 0) return;
    onSend(draftItems);
    setDraftItems([]);
    setDraftSourceMap(new Map());
  }

  const isValid = !!form.namaObat && form.jumlah > 0;

  return (
    <div className="flex flex-col gap-4">

      {/* Prescriber info bar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <User size={14} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">DPJP / Penulis</p>
            <p className="text-xs font-semibold text-slate-800">{patient.dpjp}</p>
          </div>
        </div>
        <div className="hidden h-6 w-px bg-slate-100 sm:block" />
        <div className="flex items-center gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Depo Farmasi</p>
            <select value={depo} onChange={(e) => setDepo(e.target.value)}
              className="mt-0.5 rounded-md border border-slate-200 bg-transparent px-2 py-0.5 text-xs font-medium text-slate-700 outline-none focus:border-indigo-400">
              {DEPO_OPTIONS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {patient.riwayatAlergi && (
            <span className="flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700 ring-1 ring-rose-200">
              <AlertCircle size={10} />Alergi: {patient.riwayatAlergi}
            </span>
          )}
        </div>
      </div>

      {/* ── Two-column: form (left) + active list (right) ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Left: order form */}
        <div className="flex flex-col gap-3">

          {/* Panduan toggle */}
          <button type="button" onClick={() => setShowGuide((v) => !v)}
            className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-2.5 text-left transition hover:bg-amber-50">
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700">Panduan Aturan Resep</p>
            {showGuide ? <ChevronDown size={13} className="text-amber-600" /> : <ChevronRight size={13} className="text-amber-500" />}
          </button>
          <AnimatePresence>
            {showGuide && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}
                className="overflow-hidden rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3 space-y-1"
              >
                {ATURAN_PANDUAN.map((rule, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-amber-700">
                    <span className="mt-0.5 shrink-0 text-amber-400">•</span>{rule}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>

          {/* Form card */}
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="text-xs font-semibold text-slate-700">Tambah Order Obat</p>

            <div>
              <Label required>Cari Obat</Label>
              <ObatSearch value={form.namaObat} onSelect={selectObat} />
            </div>

            <AnimatePresence>
              {form.namaObat && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.12 }}
                  className="overflow-hidden rounded-xl border border-indigo-200 bg-indigo-50/60 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-indigo-800">{form.namaObat}</p>
                    <button onClick={clearObat} className="shrink-0 text-slate-400 hover:text-slate-600"><X size={12} /></button>
                  </div>
                  <p className="text-[11px] text-indigo-400">{form.kodeObat} · {form.dosis}</p>
                  <span className={cn("mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium", KATEGORI_BADGE[form.kategori])}>
                    {form.kategori}
                  </span>
                  {form.kategori !== "Reguler" && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-600">
                      <AlertCircle size={10} />Memerlukan tanda tangan dokter &amp; stempel resmi
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label required>Jumlah</Label>
                <input type="number" min={1} value={form.jumlah}
                  onChange={(e) => setField("jumlah", Math.max(1, Number(e.target.value)))}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 outline-none focus:border-indigo-400 focus:bg-white" />
              </div>
              <div>
                <Label required>Durasi (hari)</Label>
                <input type="number" min={1} max={30} value={form.durasiHari}
                  onChange={(e) => setField("durasiHari", Math.max(1, Number(e.target.value)))}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 outline-none focus:border-indigo-400 focus:bg-white" />
              </div>
            </div>

            <div>
              <Label required>Rute Pemberian</Label>
              <div className="flex flex-wrap gap-1.5">
                {RUTE_OPTIONS.map((r) => (
                  <button key={r} type="button" onClick={() => setField("rute", r)}
                    className={cn("rounded-lg border px-2.5 py-1 text-[11px] font-medium transition",
                      form.rute === r
                        ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300")}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label required>Signa (Frekuensi)</Label>
              <div className="flex flex-wrap gap-1.5">
                {SIGNA_OPTIONS.map((s) => (
                  <button key={s.val} type="button" title={s.label} onClick={() => setField("signa", s.val)}
                    className={cn("rounded-lg border px-2.5 py-1 text-[11px] font-medium transition",
                      form.signa === s.val
                        ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300")}>
                    {s.val}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Waktu Pemberian</Label>
              <div className="flex flex-wrap gap-1.5">
                {ATURAN_WAKTU.map((a) => (
                  <button key={a} type="button" onClick={() => setField("aturanPakai", a)}
                    className={cn("rounded-lg border px-2.5 py-1 text-[11px] font-medium transition",
                      form.aturanPakai === a
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300")}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Keterangan</Label>
              <input value={form.keterangan} onChange={(e) => setField("keterangan", e.target.value)}
                placeholder="Mis: titrasi MAP ≥65, minum banyak air..."
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white" />
            </div>

            <button type="button" onClick={handleSubmit} disabled={!isValid}
              className={cn("flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition",
                isValid
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "cursor-not-allowed bg-slate-100 text-slate-400")}>
              <Plus size={14} />Tambah ke Daftar Order
            </button>
          </div>
        </div>

        {/* Right: draft queue + stopped confirmed items */}
        <div className="flex flex-col gap-3">

          {/* Draft order list */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
              <p className="text-xs font-semibold text-slate-700">Daftar Order Aktif</p>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                {draftItems.length}
              </span>
              {draftItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleSend}
                  className="ml-auto flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-indigo-700"
                >
                  <Send size={11} /> Kirim Order Resep
                </button>
              )}
            </div>
            <div className="p-3">
              {draftItems.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Pill size={22} className="mb-2 text-slate-200" />
                  <p className="text-xs text-slate-400">Belum ada obat yang diorder</p>
                  <p className="text-[11px] text-slate-300">Gunakan form kiri, atau salin dari riwayat di bawah</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {draftItems.map((item: ResepRIItem, i: number) => (
                    <ResepItemRow key={item.id} item={item} index={i}
                      onRemove={() => removeDraft(item.id)}
                      onEdit={editDraft}
                      onToggleAktif={() => {}} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stopped confirmed items (from parent) */}
          {stoppedItems.length > 0 && (
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 shadow-xs">
              <div className="border-b border-slate-100 px-4 py-2.5">
                <p className="text-xs font-semibold text-slate-400">Obat Dihentikan ({stoppedItems.length})</p>
              </div>
              <div className="p-3">
                <div className="flex flex-col gap-2">
                  {stoppedItems.map((item: ResepRIItem, i: number) => (
                    <ResepItemRow key={item.id} item={item} index={i}
                      onRemove={() => {}}
                      onEdit={() => {}}
                      onToggleAktif={() => onToggleAktif(item.id)} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Riwayat order — full width below grid ── */}
      <RiwayatSection
        groups={riwayatGroups}
        copiedIds={copiedIds}
        onCopy={copyItem}
        onCopyAll={copyAll}
      />

    </div>
  );
}
