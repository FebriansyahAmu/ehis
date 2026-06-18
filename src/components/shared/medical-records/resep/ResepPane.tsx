"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pill, User, AlertCircle, X, ChevronDown, ChevronRight,
  Copy, Check, Clock, Stethoscope, Send, Phone,
} from "lucide-react";
import type { ResepRIItem } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  SIGNA_OPTIONS, ATURAN_WAKTU, RUTE_OPTIONS, DEPO_OPTIONS,
  KATEGORI_BADGE, genResepId, todayISO, fmtTanggalRI, type ObatCatalog, type ResepPatient,
  getAlergiObatRefs, matchAlergiObatRef, mergeAlergiRefs, type AlergiObatRef,
  KONDISI_KLINIS_DEFAULT, type KondisiKlinis, obatTersediaToCatalog,
} from "@/components/shared/resep/resepShared";
import ObatSearch   from "@/components/shared/resep/ObatSearch";
import ResepItemRow from "@/components/shared/resep/ResepItemRow";
import { Select } from "@/components/shared/inputs/Select";
import {
  KondisiKlinisPanel, AlergiObatBanner, AlergiMatchWarning,
} from "@/components/shared/resep/ResepKlinisPanel";
import { getAlergi } from "@/lib/api/asesmenMedis/asesmenAlergi";
import { createResep } from "@/lib/api/resep/resep";
import { listLokasiFarmasi, type LokasiFarmasi } from "@/lib/api/master/lokasiFarmasi";
import { listObatTersedia } from "@/lib/api/master/obatTersedia";

const KUNJUNGAN_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Types ─────────────────────────────────────────────────

interface Props {
  patient:       ResepPatient;
  items:         ResepRIItem[];
  onSend:        (draft: ResepRIItem[]) => void;
  onToggleAktif: (id: string) => void;
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
  dosisSekali: "",
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
                                  {item.dosisSekali && (
                                    <>
                                      <span className="mx-1 text-slate-300">·</span>
                                      <span className="text-slate-600">{item.dosisSekali}/minum</span>
                                    </>
                                  )}
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
  const [form,           setForm]           = useState({ ...EMPTY_FORM });
  const [depo,           setDepo]           = useState<string>("Depo Rawat Inap");
  const [draftItems,     setDraftItems]     = useState<ResepRIItem[]>([]);
  const [draftSourceMap, setDraftSourceMap] = useState<Map<string, string>>(new Map());
  const [kondisi,        setKondisi]        = useState<KondisiKlinis>(KONDISI_KLINIS_DEFAULT);
  const [dbAlergiRefs,   setDbAlergiRefs]    = useState<AlergiObatRef[]>([]);
  const [lokasiFarmasi,  setLokasiFarmasi]   = useState<LokasiFarmasi[]>([]);
  const [obatKatalog,    setObatKatalog]     = useState<ObatCatalog[]>([]);
  const [sending,        setSending]         = useState(false);

  const copiedIds     = new Set(draftSourceMap.values());
  const riwayatGroups = buildGroups(items);
  const stoppedItems  = items.filter((i) => !i.aktif);

  // Tarik alergi NYATA pasien dari rekam medis (Asesmen Medis → Alergi) bila kunjungan terpersist.
  useEffect(() => {
    const kid = patient.kunjunganId;
    if (!kid || !KUNJUNGAN_UUID_RE.test(kid)) return;
    const ac = new AbortController();
    getAlergi(kid, ac.signal)
      .then((dto) => {
        if (ac.signal.aborted) return;
        setDbAlergiRefs(
          dto.items
            .filter((it) => it.category === "Obat")
            .map((it) => ({ allergen: it.allergen, reactions: it.reactions, severity: it.severity, bzaKode: it.bzaKode ?? undefined })),
        );
      })
      .catch(() => {});
    return () => ac.abort();
  }, [patient.kunjunganId]);

  // Depo tujuan = Ruangan kategori Farmasi (master); fallback DEPO_OPTIONS bila kosong/gagal.
  useEffect(() => {
    const ac = new AbortController();
    listLokasiFarmasi(ac.signal)
      .then((rows) => {
        if (ac.signal.aborted || rows.length === 0) return;
        setLokasiFarmasi(rows);
        setDepo((prev) => (rows.some((l) => l.nama === prev) ? prev : rows[0].nama));
      })
      .catch(() => {});
    return () => ac.abort();
  }, []);

  const depoOptions = lokasiFarmasi.length ? lokasiFarmasi.map((l) => l.nama) : [...DEPO_OPTIONS];

  // Katalog cari-obat = obat ter-formularium DB (obat-tersedia). Kosong → ObatSearch fallback ke
  // OBAT_CATALOG mock. Obat tampil HANYA bila Aktif & masuk formularium (Mapping Hub → Formularium).
  useEffect(() => {
    const ac = new AbortController();
    listObatTersedia({}, ac.signal)
      .then((rows) => { if (!ac.signal.aborted) setObatKatalog(rows.map(obatTersediaToCatalog)); })
      .catch(() => {});
    return () => ac.abort();
  }, []);

  // Referensi alergi obat = DB (rekam medis) ⊕ teks bebas/mock anamnesis. DPJP kontak → "-".
  const alergiRefs    = mergeAlergiRefs(dbAlergiRefs, getAlergiObatRefs(patient.noRM, patient.riwayatAlergi));
  const alergiObat    = alergiRefs.map((r) => r.allergen);
  const dpjpKontak    = patient.dpjpKontak?.trim() || "-";
  const formAlergiHit = form.namaObat ? matchAlergiObatRef(form.namaObat, alergiRefs) : null;

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
      dosisSekali:  src.dosisSekali,
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

  async function handleSend() {
    if (draftItems.length === 0) return;
    const kid = patient.kunjunganId;
    if (kid && KUNJUNGAN_UUID_RE.test(kid)) {
      setSending(true);
      try {
        await createResep(kid, {
          depoKode: lokasiFarmasi.find((l) => l.nama === depo)?.kode,
          depoNama: depo,
          kondisiGinjal: kondisi.ginjal,
          kondisiMenyusui: kondisi.menyusui,
          kondisiKehamilan: kondisi.kehamilan,
          prioritas: "Rutin",
          penulis: patient.dpjp,
          penulisKontak: patient.dpjpKontak && patient.dpjpKontak !== "-" ? patient.dpjpKontak : undefined,
          items: draftItems.map((it) => ({
            kodeObat: it.kodeObat,
            namaObat: it.namaObat,
            dosis: it.dosis || undefined,
            dosisSekali: it.dosisSekali || undefined,
            signa: it.signa || undefined,
            jumlah: it.jumlah,
            rute: it.rute || undefined,
            aturanPakai: it.aturanPakai || undefined,
            kategori: it.kategori,
            durasiHari: it.durasiHari,
            keterangan: it.keterangan || undefined,
          })),
        });
      } catch {
        setSending(false);
        return; // gagal → pertahankan draft (boundary error sudah toast di api client)
      }
      setSending(false);
    }
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
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Dokter Penulis</p>
            <p className="text-xs font-semibold text-slate-800">{patient.dpjp}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
              <Phone size={10} className="shrink-0" />
              {dpjpKontak}
            </p>
          </div>
        </div>
        <div className="hidden h-6 w-px bg-slate-100 sm:block" />
        <div className="flex items-center gap-2">
          <div>
            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">Depo Farmasi</p>
            <Select value={depo} onChange={setDepo} options={depoOptions} className="h-7 min-w-40 py-0" />
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

      {/* Two-column: form (left) + active list (right) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Left: order form */}
        <div className="flex flex-col gap-3">

          <KondisiKlinisPanel gender={patient.gender} value={kondisi} onChange={setKondisi} />

          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="text-xs font-semibold text-slate-700">Tambah Order Obat</p>

            <AlergiObatBanner allergens={alergiObat} />

            <div>
              <Label required>Cari Obat</Label>
              <ObatSearch
                value={form.namaObat}
                onSelect={selectObat}
                catalog={obatKatalog.length ? obatKatalog : undefined}
                showStock={obatKatalog.length === 0}
              />
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

            {formAlergiHit && <AlergiMatchWarning allergen={formAlergiHit.allergen} reactions={formAlergiHit.reactions} />}

            <div>
              <Label>Dosis Sekali Minum</Label>
              <input value={form.dosisSekali} onChange={(e) => setField("dosisSekali", e.target.value)}
                placeholder="Mis: 1 tablet, 500 mg, 5 mL"
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white" />
            </div>

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
                  disabled={sending}
                  className="ml-auto flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={11} /> {sending ? "Mengirim…" : "Kirim Order Resep"}
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
                      onToggleAktif={() => {}}
                      alergiHit={matchAlergiObatRef(item.namaObat, alergiRefs)} />
                  ))}
                </div>
              )}
            </div>
          </div>

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
                      onToggleAktif={() => onToggleAktif(item.id)}
                      alergiHit={matchAlergiObatRef(item.namaObat, alergiRefs)} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Riwayat order — full width */}
      <RiwayatSection
        groups={riwayatGroups}
        copiedIds={copiedIds}
        onCopy={copyItem}
        onCopyAll={copyAll}
      />
    </div>
  );
}
