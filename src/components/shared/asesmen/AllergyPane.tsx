"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, CheckCircle2, HelpCircle, ShieldCheck,
  Trash2, Plus, History, Loader2, CornerDownLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type AllergyEntry, type AllergyCategory, type AllergySeverity, type AllergyStatus,
  CAT_CFG, SEV_CFG, SNOMED_CODES, ALLERGY_MOCK,
} from "./asesmenShared";
import { useAsesmenKatalog } from "./asesmenKatalogContext";
import ObatAllergenInput from "@/components/shared/asesmen/ObatAllergenInput";
import { listObatTersedia, type ObatTersediaDTO } from "@/lib/api/master/obatTersedia";
import {
  getAlergi, addAlergi, deleteAlergi, setAlergiNka, type AlergiItemDTO,
} from "@/lib/api/asesmenMedis/asesmenAlergi";
import {
  getAlergiSebelumnya, type AlergiSebelumnyaItemDTO,
} from "@/lib/api/asesmenMedis/alergiSebelumnya";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isAbort = (e: unknown): boolean => e instanceof DOMException && e.name === "AbortError";
const errMsg = (e: unknown, fb: string) => (e instanceof ApiError ? e.message : fb);

function dtoItemToEntry(it: AlergiItemDTO): AllergyEntry {
  return {
    id: it.id, category: it.category, allergen: it.allergen, reactions: it.reactions,
    severity: it.severity, status: it.status, keterangan: it.keterangan ?? "",
    snomedCode: it.snomedCode ?? undefined, bzaKode: it.bzaKode ?? undefined,
  };
}

// AlergiItemInput dari item riwayat (carry-forward) atau form.
function toInput(d: {
  category: AllergyCategory; allergen: string; reactions: string[];
  severity: AllergySeverity; status: AllergyStatus;
  keterangan?: string | null; snomedCode?: string | null; bzaKode?: string | null;
}) {
  return {
    category: d.category, allergen: d.allergen.trim(), reactions: d.reactions,
    severity: d.severity, status: d.status,
    keterangan: d.keterangan?.trim() || undefined,
    snomedCode: d.snomedCode || undefined,
    bzaKode: d.bzaKode || undefined,
  };
}

// ── Allergy card ──────────────────────────────────────────

export function AllergyCard({ entry, onDelete, deleting }: { entry: AllergyEntry; onDelete: (id: string) => void; deleting?: boolean }) {
  const cat     = CAT_CFG[entry.category];
  const sev     = SEV_CFG[entry.severity];
  const CatIcon = cat.icon;

  return (
    <div className={cn("overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition-shadow hover:shadow-sm", sev.borderL)}>
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
          <CatIcon size={14} className={cat.iconCls} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-bold text-slate-800">{entry.allergen}</p>
            <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold", sev.badgeCls)}>{entry.severity}</span>
            <span className={cn(
              "flex items-center gap-0.5 rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1",
              entry.status === "Terkonfirmasi"
                ? "bg-sky-50 text-sky-600 ring-sky-200"
                : "bg-slate-100 text-slate-500 ring-slate-200",
            )}>
              {entry.status === "Terkonfirmasi" ? <CheckCircle2 size={9} /> : <HelpCircle size={9} />}
              {entry.status}
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{entry.category}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {entry.reactions.map(r => (
              <span key={r} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{r}</span>
            ))}
          </div>
          {entry.snomedCode && (
            <p className="mt-1.5 flex items-center gap-1">
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-400">SNOMED</span>
              <span className="font-mono text-[10px] text-slate-500">{entry.snomedCode}</span>
              <span className="text-[10px] text-slate-400">
                — {SNOMED_CODES.find(s => s.code === entry.snomedCode)?.display ?? ""}
              </span>
            </p>
          )}
          {entry.bzaKode && (
            <p className="mt-1.5 flex items-center gap-1">
              <span className="rounded bg-sky-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-sky-500 ring-1 ring-sky-100">BZA</span>
              <span className="font-mono text-[10px] text-sky-700">{entry.bzaKode}</span>
              <span className="text-[10px] text-slate-400">— zat aktif KFA (tertaut peresepan)</span>
            </p>
          )}
          {entry.keterangan && (
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500 italic">{entry.keterangan}</p>
          )}
        </div>
        <button type="button" onClick={() => onDelete(entry.id)} disabled={deleting}
          className="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40"
          aria-label={`Hapus alergi ${entry.allergen}`}>
          {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        </button>
      </div>
    </div>
  );
}

// ── Prior-allergy row (riwayat → carry-forward) ───────────

function PriorAllergyRow({ item, busy, onBring }: {
  item: AlergiSebelumnyaItemDTO; busy: boolean; onBring: () => void;
}) {
  const sev = SEV_CFG[item.severity];
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-800">{item.allergen}</span>
          <span className={cn("rounded-md px-1.5 py-0.5 text-[9px] font-bold", sev.badgeCls)}>{item.severity}</span>
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">{item.category}</span>
          <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 ring-1 ring-amber-200">{item.unitLabel} · {item.tanggal}</span>
        </div>
        <p className="mt-0.5 truncate text-[10px] text-slate-500">{item.reactions.join(", ")}</p>
      </div>
      <button type="button" onClick={onBring} disabled={busy}
        className="flex shrink-0 items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-[11px] font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-40"
        title="Salin alergi ini ke rekam kunjungan ini">
        {busy ? <Loader2 size={12} className="animate-spin" /> : <CornerDownLeft size={12} />} Bawa
      </button>
    </div>
  );
}

// ── Input helpers ─────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      {children}{required && <span className="ml-0.5 text-rose-400">*</span>}
    </p>
  );
}

// ── Props ─────────────────────────────────────────────────

interface AllergyPaneProps {
  noRM: string;
  kunjunganId?: string; // id kunjungan DB (UUID) → persist; non-UUID/undefined → demo lokal
  onComplete?: (done: boolean) => void;
}

// ── Main pane ─────────────────────────────────────────────

export default function AllergyPane({ noRM, kunjunganId, onComplete }: AllergyPaneProps) {
  const kid = kunjunganId ?? "";
  const persisted = UUID_RE.test(kid);

  // Opsi dropdown (quick-pick allergen Makanan/Lainnya + reaksi + SNOMED) dari master Asesmen
  // Katalog (DB) — fallback konstanta bila tanpa Provider / gagal fetch.
  const { quickPicks, reactions, snomedCodes } = useAsesmenKatalog();

  const [entries, setEntries] = useState<AllergyEntry[]>(
    () => (persisted ? [] : structuredClone(ALLERGY_MOCK[noRM] ?? [])),
  );
  const [noKA, setNoKA] = useState(false);
  const [prior, setPrior] = useState<AlergiSebelumnyaItemDTO[]>([]);
  const [nkaSebelumnya, setNkaSebelumnya] = useState(false);

  const [loading, setLoading]       = useState(persisted);
  const [adding, setAdding]         = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bringingId, setBringingId] = useState<string | null>(null);
  const [bringingAll, setBringingAll] = useState(false);
  const [nkaSaving, setNkaSaving]   = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const [form, setForm] = useState<{
    category: AllergyCategory; allergen: string; reactions: string[];
    severity: AllergySeverity; status: AllergyStatus;
    keterangan: string; snomedCode: string; bzaKode: string;
  }>({ category: "Obat", allergen: "", reactions: [], severity: "Sedang", status: "Terkonfirmasi", keterangan: "", snomedCode: "", bzaKode: "" });

  // Muat daftar alergi aktif + NKA + riwayat alergi (kunjungan lain) dari DB. Demo → mock.
  useEffect(() => {
    if (!persisted) return;
    const ac = new AbortController();
    (async () => {
      try {
        const [dto, sb] = await Promise.all([
          getAlergi(kid, ac.signal),
          getAlergiSebelumnya(kid, ac.signal),
        ]);
        if (ac.signal.aborted) return;
        setEntries(dto.items.map(dtoItemToEntry));
        setNoKA(dto.nka);
        setPrior(sb.items);
        setNkaSebelumnya(sb.nkaSebelumnya);
        onComplete?.(dto.nka || dto.items.length > 0);
      } catch (e) {
        if (!isAbort(e)) setError(errMsg(e, "Gagal memuat data alergi."));
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [kid, persisted, onComplete]);

  // Katalog Obat (ter-formularium) → opsi allergen kategori Obat + kode BZA.
  const [obatList, setObatList] = useState<ObatTersediaDTO[]>([]);
  useEffect(() => {
    const ac = new AbortController();
    listObatTersedia({}, ac.signal).then((r) => { if (!ac.signal.aborted) setObatList(r); }).catch(() => {});
    return () => ac.abort();
  }, []);

  const setF = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const toggleReaction = (r: string) =>
    setF("reactions", form.reactions.includes(r) ? form.reactions.filter(x => x !== r) : [...form.reactions, r]);

  const canAdd = form.allergen.trim() !== "" && form.reactions.length > 0;
  const resetForm = () => setForm(p => ({ ...p, allergen: "", reactions: [], keterangan: "", snomedCode: "", bzaKode: "" }));

  // Riwayat alergi yang BELUM ada di daftar kunjungan ini (dedup per allergen).
  const haveAllergen = new Set(entries.map(e => e.allergen.trim().toLowerCase()));
  const priorVisible = prior.filter(p => !haveAllergen.has(p.allergen.trim().toLowerCase()));

  async function handleAdd() {
    if (!canAdd || adding) return;
    const input = toInput(form);
    if (!persisted) {
      setEntries(p => [{ id: `alg-${Date.now()}`, ...input, keterangan: input.keterangan ?? "" }, ...p]);
      setNoKA(false); resetForm(); onComplete?.(true);
      return;
    }
    setAdding(true); setError(null);
    try {
      const item = await addAlergi(kid, input);
      setEntries(p => [dtoItemToEntry(item), ...p]);
      setNoKA(false); resetForm(); onComplete?.(true);
      toast.success("Alergi ditambahkan", `${item.allergen} · tercatat ke rekam medis.`);
    } catch (e) {
      setError(errMsg(e, "Gagal menambah alergi."));
    } finally {
      setAdding(false);
    }
  }

  async function bringOne(item: AlergiSebelumnyaItemDTO) {
    if (!persisted || bringingId || bringingAll) return;
    setBringingId(item.sourceId); setError(null);
    try {
      const created = await addAlergi(kid, toInput(item));
      setEntries(p => [dtoItemToEntry(created), ...p]);
      setNoKA(false); onComplete?.(true);
      toast.success("Alergi dibawa", `${item.allergen} · disalin ke rekam kunjungan ini.`);
    } catch (e) {
      setError(errMsg(e, "Gagal menyalin alergi."));
    } finally {
      setBringingId(null);
    }
  }

  async function bringAll() {
    if (!persisted || bringingAll || bringingId) return;
    const snapshot = priorVisible;
    if (snapshot.length === 0) return;
    setBringingAll(true); setError(null);
    try {
      for (const item of snapshot) {
        const created = await addAlergi(kid, toInput(item));
        setEntries(p => [dtoItemToEntry(created), ...p]);
      }
      setNoKA(false); onComplete?.(true);
      toast.success("Semua alergi dibawa", `${snapshot.length} alergi disalin ke rekam kunjungan ini.`);
    } catch (e) {
      setError(errMsg(e, "Gagal menyalin sebagian alergi."));
    } finally {
      setBringingAll(false);
    }
  }

  async function handleDelete(id: string) {
    if (!persisted) {
      const updated = entries.filter(e => e.id !== id);
      setEntries(updated);
      if (updated.length === 0 && !noKA) onComplete?.(false);
      return;
    }
    if (deletingId) return;
    setDeletingId(id); setError(null);
    try {
      await deleteAlergi(kid, id);
      const updated = entries.filter(e => e.id !== id);
      setEntries(updated);
      if (updated.length === 0 && !noKA) onComplete?.(false);
    } catch (e) {
      setError(errMsg(e, "Gagal menghapus alergi."));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleNKA(val: boolean) {
    if (!persisted) {
      setNoKA(val); onComplete?.(val || entries.length > 0);
      return;
    }
    if (nkaSaving) return;
    setNkaSaving(true); setError(null);
    try {
      const dto = await setAlergiNka(kid, val);
      setNoKA(dto.nka);
      setEntries(dto.items.map(dtoItemToEntry));
      onComplete?.(dto.nka || dto.items.length > 0);
    } catch (e) {
      setError(errMsg(e, "Gagal mengubah status NKA."));
    } finally {
      setNkaSaving(false);
    }
  }

  const severeEntries = entries.filter(e => e.severity === "Berat");

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-16 text-slate-400 shadow-sm">
        <Loader2 size={16} className="animate-spin text-sky-500" />
        <span className="text-xs">Memuat data alergi…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Error banner */}
      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
          <AlertTriangle size={14} className="shrink-0" /> {error}
        </div>
      )}

      {/* Severe allergy banner */}
      <AnimatePresence>
        {severeEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}
            className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100">
              <AlertTriangle size={14} className="text-rose-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Peringatan Alergi — Risiko Tinggi</p>
              <p className="mt-0.5 text-[11px] text-rose-600">
                {severeEntries.map(e => (
                  <span key={e.id} className="mr-2 font-semibold">{e.allergen} ({e.reactions.join(", ")})</span>
                ))}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Riwayat alergi sebelumnya (carry-forward) */}
      <AnimatePresence>
        {priorVisible.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50/60 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2 border-b border-amber-100 px-4 py-2.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                <History size={13} /> Riwayat Alergi dari Kunjungan Sebelumnya
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">{priorVisible.length}</span>
              </span>
              <button type="button" onClick={bringAll} disabled={bringingAll || !!bringingId}
                className="flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50">
                {bringingAll ? <Loader2 size={12} className="animate-spin" /> : <CornerDownLeft size={12} />} Bawa Semua
              </button>
            </div>
            <p className="px-4 pt-2 text-[10px] text-amber-700/80">
              Tinjau alergi yang tercatat di kunjungan lain pasien ini, lalu <span className="font-semibold">Bawa</span> ke rekam kunjungan ini bila masih relevan.
            </p>
            <div className="flex flex-col gap-2 p-3">
              {priorVisible.map(item => (
                <PriorAllergyRow key={item.sourceId} item={item} busy={bringingAll || bringingId === item.sourceId} onBring={() => bringOne(item)} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4 md:flex-row md:items-start">

        {/* Left: Add form */}
        <div className={cn("flex flex-col gap-3 md:w-64 md:shrink-0 transition-opacity", noKA && "pointer-events-none opacity-40")}>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-linear-to-r from-slate-50 to-white px-4 py-2.5">
              <span className="text-xs font-semibold text-slate-700">Tambah Alergi Baru</span>
            </div>
            <div className="flex flex-col gap-3 p-4">

              {/* Category */}
              <div>
                <Label required>Kategori</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["Obat", "Makanan", "Lainnya"] as AllergyCategory[]).map(cat => {
                    const cfg = CAT_CFG[cat]; const Icon = cfg.icon; const active = form.category === cat;
                    return (
                      <button key={cat} type="button" onClick={() => setF("category", cat)}
                        className={cn("flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-[10px] font-semibold transition",
                          active ? cfg.activeCls : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50")}>
                        <Icon size={14} className={active ? undefined : "text-slate-400"} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Allergen name */}
              <div>
                <Label required>Nama Alergen</Label>
                {form.category === "Obat" ? (
                  <ObatAllergenInput
                    value={form.allergen}
                    bzaKode={form.bzaKode}
                    obatList={obatList}
                    onChange={(allergen, bzaKode) => setForm(p => ({ ...p, allergen, bzaKode }))}
                  />
                ) : (
                  <>
                    <input type="text" value={form.allergen}
                      onChange={e => setF("allergen", e.target.value)}
                      placeholder="Ketik nama alergen..."
                      className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100" />
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {quickPicks[form.category].map(pick => (
                        <button key={pick} type="button" onClick={() => setF("allergen", pick)}
                          className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium transition",
                            form.allergen === pick ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500 hover:bg-sky-50 hover:text-sky-600")}>
                          {pick}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* SNOMED CT — non-Obat */}
              {form.category !== "Obat" && (
                <div>
                  <Label>Kode SNOMED CT</Label>
                  <select value={form.snomedCode} onChange={e => setF("snomedCode", e.target.value)}
                    className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-2 text-xs outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100">
                    <option value="">— Pilih kode SNOMED CT —</option>
                    {snomedCodes.map(s => <option key={s.code} value={s.code}>[{s.code}] {s.display}</option>)}
                  </select>
                </div>
              )}

              {/* Reactions */}
              <div>
                <Label required>Jenis Reaksi</Label>
                <div className="flex flex-wrap gap-1">
                  {reactions.map(r => {
                    const sel = form.reactions.includes(r);
                    return (
                      <button key={r} type="button" onClick={() => toggleReaction(r)}
                        className={cn("rounded-md px-2 py-1 text-[10px] font-semibold transition",
                          sel ? "bg-rose-100 text-rose-700 ring-1 ring-rose-200" : "bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600")}>
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Severity */}
              <div>
                <Label required>Tingkat Keparahan</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["Ringan", "Sedang", "Berat"] as AllergySeverity[]).map(sev => {
                    const cfg = SEV_CFG[sev]; const active = form.severity === sev;
                    return (
                      <button key={sev} type="button" onClick={() => setF("severity", sev)}
                        className={cn("rounded-lg border py-1.5 text-[11px] font-semibold transition",
                          active ? cfg.activeCls : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50")}>
                        {sev}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status */}
              <div>
                <Label>Status Konfirmasi</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["Terkonfirmasi", "Dicurigai"] as AllergyStatus[]).map(s => {
                    const Icon = s === "Terkonfirmasi" ? CheckCircle2 : HelpCircle; const active = form.status === s;
                    return (
                      <button key={s} type="button" onClick={() => setF("status", s)}
                        className={cn("flex items-center justify-center gap-1 rounded-lg border py-1.5 text-[11px] font-semibold transition",
                          active ? "border-sky-400 bg-sky-50 text-sky-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50")}>
                        <Icon size={11} />{s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>Keterangan</Label>
                <textarea rows={2} value={form.keterangan}
                  onChange={e => setF("keterangan", e.target.value)}
                  placeholder="Catatan tambahan, kondisi khusus..."
                  className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100" />
              </div>

              <button type="button" onClick={handleAdd} disabled={!canAdd || adding}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-rose-600 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40">
                {adding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Tambah Alergi
              </button>
              {!persisted && (
                <p className="text-center text-[10px] text-amber-600">Pasien demo — tidak tersimpan ke database.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Allergy list */}
        <div className="flex flex-1 flex-col gap-3 md:min-w-0">

          {/* NKA toggle */}
          <button type="button" onClick={() => handleNKA(!noKA)} disabled={nkaSaving}
            className={cn("flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all disabled:opacity-60",
              noKA ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50")}>
            <div className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", noKA ? "bg-emerald-500" : "bg-slate-200")}>
              <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200", noKA ? "translate-x-4" : "translate-x-0.5")} />
            </div>
            <div className="flex-1">
              <p className={cn("text-xs font-semibold", noKA ? "text-emerald-800" : "text-slate-600")}>
                Tidak Ada Riwayat Alergi yang Diketahui (NKA)
              </p>
              <p className={cn("text-[10px]", noKA ? "text-emerald-600" : "text-slate-400")}>
                {noKA ? "Pasien tidak memiliki riwayat alergi tercatat" : "Aktifkan jika pasien tidak memiliki riwayat alergi"}
              </p>
            </div>
            {nkaSaving ? <Loader2 size={16} className="shrink-0 animate-spin text-slate-400" /> : noKA && <ShieldCheck size={16} className="shrink-0 text-emerald-500" />}
          </button>

          {/* Count + severity summary */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-700">
              Daftar Alergi
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {entries.length}
              </span>
            </p>
            {entries.length > 0 && (
              <div className="flex gap-1.5 text-[10px]">
                {(["Berat", "Sedang", "Ringan"] as AllergySeverity[]).map(sev => {
                  const count = entries.filter(e => e.severity === sev).length;
                  if (count === 0) return null;
                  return (
                    <span key={sev} className={cn("rounded-md px-2 py-0.5 font-semibold", SEV_CFG[sev].badgeCls)}>
                      {count} {sev}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* List or empty states */}
          {noKA && entries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-10 text-center">
              <ShieldCheck size={22} className="text-emerald-400" />
              <p className="text-xs font-semibold text-emerald-700">Tidak Ada Riwayat Alergi Diketahui</p>
              <p className="text-[11px] text-emerald-500">NKA telah dikonfirmasi dan dicatat</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center shadow-sm">
              <AlertTriangle size={22} className="text-slate-300" />
              <p className="text-xs font-medium text-slate-400">Belum ada alergi yang dicatat</p>
              <p className="text-[11px] text-slate-400">
                {priorVisible.length > 0
                  ? "Bawa dari riwayat di atas, tambahkan dari panel kiri, atau aktifkan NKA"
                  : nkaSebelumnya
                  ? "Kunjungan sebelumnya menyatakan NKA — tambahkan bila ada, atau aktifkan NKA"
                  : "Tambahkan dari panel kiri, atau aktifkan NKA"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {entries.map(entry => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 24, scale: 0.97 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <AllergyCard entry={entry} onDelete={handleDelete} deleting={deletingId === entry.id} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
