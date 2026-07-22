"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight, X, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatientMaster } from "@/lib/data";
import { patientMasterData } from "@/lib/data";
import { listKunjungan, type KunjunganDTO } from "@/lib/api/kunjungan";
import { getPatient } from "@/lib/api/patients";
import { getDokter } from "@/lib/api/dokter";
import { getTree } from "@/lib/api/ruangan";
import { consumeSpri, listSpri, type SpriDTO } from "@/lib/api/spri/spri";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import { dtoToKunjunganRecord } from "./patient/kunjunganRiwayatApi";
import { dtoToBillingRecord } from "./patient/patientBillingApi";
import { listPatientBilling } from "@/lib/api/billing/projection";
import { dtoToPatientMaster } from "./pasien-list/pasienListApi";

// id pasien DB = UUID; pasien demo/mock = "RM-..." → hanya UUID yang punya riwayat di API.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

import { parseIndoDate, type JadwalItem } from "./patient/config";
import { PatientHero } from "./patient/PatientHero";
import { PatientLeftPanel } from "./patient/PatientLeftPanel";
import { PatientRightPanel } from "./patient/PatientRightPanel";
import { EditDataModal } from "./patient/modals/EditDataModal";
import { EditKontakModal } from "./patient/modals/EditKontakModal";
import { RiwayatKunjunganModal } from "./patient/modals/RiwayatKunjunganModal";
import { TambahJadwalModal } from "./patient/modals/TambahJadwalModal";
import { DaftarKunjunganModal } from "./patient/modals/DaftarKunjunganModal";
import { InfoDetailModal } from "./patient/modals/InfoDetailModal";

export default function PatientDashboard({ patient: init }: { patient: PatientMaster }) {
  // ── Multi-tab state ────────────────────────────────────────
  const [tabs, setTabs] = useState<PatientMaster[]>([init]);
  const [activeId, setActiveId] = useState(init.id);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // SPRI worklist (terbit, belum dikonsumsi) → keterangan "SPRI Diterbitkan" di node Riwayat.
  // Key by kunjunganId (IGD asal) + riKunjunganId (RI hasil). Lintas-pasien (filter di node by id).
  const [spriByKunjungan, setSpriByKunjungan] = useState<Record<string, SpriDTO>>({});
  // Nama DPJP per id (master Dokter.id → namaTampil). Riwayat dari API hanya bawa dpjpId;
  // nama diresolusi lazy + dedup (global lintas-tab — id dokter sama di mana pun).
  const [dokterNama, setDokterNama] = useState<Record<string, string>>({});
  const resolvedDpjp = useRef<Set<string>>(new Set());
  // Nama ruangan/lokasi perawatan per id (master Location.id → name). Tree global → fetch sekali.
  const [ruanganNama, setRuanganNama] = useState<Record<string, string>>({});

  const patient = tabs.find((t) => t.id === activeId) ?? tabs[0];

  function setPatient(value: PatientMaster | ((prev: PatientMaster) => PatientMaster)) {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeId ? (typeof value === "function" ? value(t) : value) : t,
      ),
    );
  }

  function switchTab(id: string) {
    setActiveId(id);
    setEditData(false);
    setEditKontak(false);
    setRiwayat(false);
    setInfoLengkap(false);
    setShowSearch(false);
    setShowTambahJadwal(false);
  }

  function openPatient(p: PatientMaster) {
    if (!tabs.some((t) => t.id === p.id)) setTabs((prev) => [...prev, p]);
    switchTab(p.id);
    setSearchQuery("");
  }

  function closeTab(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (tabs.length <= 1) return;
    const idx = tabs.findIndex((t) => t.id === id);
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (activeId === id) setActiveId(remaining[Math.max(0, idx - 1)].id);
  }

  const allPatients = useMemo(() => Object.values(patientMasterData), []);
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = q
      ? allPatients.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.noRM.toLowerCase().includes(q) ||
            p.nik.includes(q),
        )
      : allPatients;
    return list.slice(0, 6);
  }, [searchQuery, allPatients]);

  // ── Per-patient modal state ────────────────────────────────
  const [showEditData, setEditData] = useState(false);
  const [showEditKontak, setEditKontak] = useState(false);
  const [showRiwayat, setRiwayat] = useState(false);
  const [showDaftarKunjungan, setDaftarKunjungan] = useState(false);
  const [showTambahJadwal, setShowTambahJadwal] = useState(false);
  const [showInfoLengkap, setInfoLengkap] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  // SPRI worklist (Terbit/MenungguRef, belum dikonsumsi) → keterangan "SPRI Diterbitkan" di
  // node Riwayat. Map by kunjunganId (IGD asal) + riKunjunganId (RI hasil). Refetch pasca-admisi.
  const loadSpri = useCallback(async (signal?: AbortSignal) => {
    try {
      const items = await listSpri({}, signal);
      const map: Record<string, SpriDTO> = {};
      for (const s of items) {
        map[s.kunjunganId] = s;
        if (s.riKunjunganId) map[s.riKunjunganId] = s;
      }
      setSpriByKunjungan(map);
    } catch {
      /* abort/gagal → tanpa keterangan SPRI */
    }
  }, []);
  useEffect(() => {
    const ac = new AbortController();
    void loadSpri(ac.signal);
    return () => ac.abort();
  }, [loadSpri]);

  // Auto-buka Daftar Kunjungan via deep-link (hanya sekali saat mount):
  //  · ?daftar=rj&kodebooking=…  → Respon Kedatangan antrean (ANT4)
  //  · ?daftar=ranap&spri=…      → Admisi Rawat Inap dari worklist SPRI (seed unit Rawat Inap;
  //    konsumsi SPRI setelah kunjungan RI terdaftar)
  const searchParams = useSearchParams();
  const [antreanKode, setAntreanKode] = useState<string | undefined>(undefined);
  const [ranapMode, setRanapMode] = useState(false);
  const [ranapSpriId, setRanapSpriId] = useState<string | undefined>(undefined);
  useEffect(() => {
    const daftar = searchParams.get("daftar");
    if (daftar === "rj") {
      setAntreanKode(searchParams.get("kodebooking") ?? undefined);
      setDaftarKunjungan(true);
    } else if (daftar === "ranap") {
      setRanapMode(true);
      setRanapSpriId(searchParams.get("spri") ?? undefined);
      setDaftarKunjungan(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Konsumsi SPRI setelah admisi Rawat Inap terdaftar → tautkan kunjungan RI + keluar worklist.
  async function handleRanapRegistered(kunjungan: KunjunganDTO) {
    await refreshPatientData(patient.id);
    if (!ranapSpriId) return;
    try {
      await consumeSpri(ranapSpriId, kunjungan.id);
      void loadSpri(); // segarkan keterangan SPRI (status berubah Dikonsumsi → keluar worklist)
      toast.success("Admisi Rawat Inap dibuat", "SPRI ditandai dikonsumsi — keluar dari worklist admisi.");
    } catch (e) {
      toast.error("Gagal menautkan SPRI", e instanceof ApiError ? e.message : undefined);
    }
  }

  // Riwayat kunjungan dari API (pasien DB). Sumber kebenaran = DB → REPLACE riwayat tab
  // (idempoten). Tandai loaded SETELAH sukses, bukan sebelum: di React StrictMode (dev)
  // effect jalan 2× + cleanup meng-abort; menandai di awal akan memblokir fetch run-2 →
  // riwayat kosong. Guard post-sukses → run-1 ke-abort, run-2 tetap fetch & isi.
  const fetchedRiwayat = useRef<Set<string>>(new Set());
  useEffect(() => {
    const pid = patient.id;
    if (!UUID_RE.test(pid) || fetchedRiwayat.current.has(pid)) return;
    const ac = new AbortController();
    listKunjungan({ patientId: pid, limit: 50 }, ac.signal)
      .then(({ items }) => {
        fetchedRiwayat.current.add(pid); // tandai HANYA setelah sukses
        const recs = items.map(dtoToKunjunganRecord);
        setTabs((prev) =>
          prev.map((t) => (t.id === pid ? { ...t, riwayatKunjungan: recs } : t)),
        );
      })
      .catch(() => { /* abort/gagal: jangan tandai → boleh retry */ });
    return () => ac.abort();
  }, [patient.id]);

  // Ringkasan tagihan per kunjungan (proyeksi billing NYATA) → kartu Tagihan. Gate
  // registration.kunjungan:read (staf loket). Gagal/403 → billing tetap [] (kartu empty-state).
  const fetchedBilling = useRef<Set<string>>(new Set());
  useEffect(() => {
    const pid = patient.id;
    if (!UUID_RE.test(pid) || fetchedBilling.current.has(pid)) return;
    const ac = new AbortController();
    listPatientBilling(pid, ac.signal)
      .then((rows) => {
        fetchedBilling.current.add(pid); // tandai HANYA setelah sukses
        const bills = rows.map(dtoToBillingRecord);
        setTabs((prev) =>
          prev.map((t) => (t.id === pid ? { ...t, billing: bills } : t)),
        );
      })
      .catch(() => { /* abort/gagal: jangan tandai → boleh retry */ });
    return () => ac.abort();
  }, [patient.id]);

  // Resolusi nama DPJP untuk record riwayat (yang cuma punya dpjpId). Kumpulkan id unik
  // yang belum diresolusi → fetch master Dokter (dedup via ref global). Pola sama
  // KunjunganResolver. Gagal → lepas tanda agar boleh retry.
  useEffect(() => {
    const ids = Array.from(
      new Set(
        patient.riwayatKunjungan
          .map((k) => k.dpjpId)
          .filter((id): id is string => !!id && UUID_RE.test(id) && !resolvedDpjp.current.has(id)),
      ),
    );
    if (ids.length === 0) return;
    const ac = new AbortController();
    ids.forEach((id) => resolvedDpjp.current.add(id));
    Promise.all(
      ids.map(async (id) => {
        try {
          const d = await getDokter(id, ac.signal);
          return [id, d.namaTampil] as const;
        } catch {
          resolvedDpjp.current.delete(id); // gagal → boleh retry
          return null;
        }
      }),
    ).then((pairs) => {
      const valid = pairs.filter((p): p is readonly [string, string] => p !== null);
      if (valid.length) setDokterNama((prev) => ({ ...prev, ...Object.fromEntries(valid) }));
    });
    return () => ac.abort();
  }, [patient.riwayatKunjungan]);

  // Peta nama ruangan perawatan (master Location.id → name) — fetch tree SEKALI (global,
  // tak per-pasien). Dipakai enrich `ruangan` di record riwayat (mis. "Bedah"/"Non Bedah").
  useEffect(() => {
    const ac = new AbortController();
    getTree(ac.signal)
      .then((nodes) => {
        const map: Record<string, string> = {};
        for (const n of nodes) if (n.type === "Location") map[n.id] = n.name;
        setRuanganNama(map);
      })
      .catch(() => { /* abort/gagal → tanpa nama ruangan */ });
    return () => ac.abort();
  }, []);

  // Pasien dengan nama DPJP + ruangan terisi (dari peta) untuk panel tampilan. Enrich hanya
  // field yang punya id-nya & sudah diresolusi → tak ganggu data mock (yang sudah lengkap).
  const patientView = useMemo<PatientMaster>(() => {
    if (Object.keys(dokterNama).length === 0 && Object.keys(ruanganNama).length === 0) return patient;
    let changed = false;
    const recs = patient.riwayatKunjungan.map((k) => {
      let next = k;
      if (k.dpjpId && k.dokter === "—" && dokterNama[k.dpjpId]) {
        next = { ...next, dokter: dokterNama[k.dpjpId] };
      }
      if (k.ruanganId && !k.ruangan && ruanganNama[k.ruanganId]) {
        next = { ...next, ruangan: ruanganNama[k.ruanganId] };
      }
      if (next !== k) changed = true;
      return next;
    });
    return changed ? { ...patient, riwayatKunjungan: recs } : patient;
  }, [patient, dokterNama, ruanganNama]);

  // Refresh data DB pasien (penjamin + riwayat) — dipakai setelah daftar kunjungan.
  // Jaminan aktif ikut kunjungan terakhir → ambil ulang penjamin primer + timeline.
  async function refreshPatientData(id: string) {
    if (!UUID_RE.test(id)) return;
    try {
      const [dto, list] = await Promise.all([
        getPatient(id),
        listKunjungan({ patientId: id, limit: 50 }),
      ]);
      const fresh = dtoToPatientMaster(dto);
      const recs = list.items.map(dtoToKunjunganRecord);
      setTabs((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, penjamin: fresh.penjamin, riwayatKunjungan: recs } : t,
        ),
      );
    } catch {
      /* abaikan: pertahankan data lama bila refresh gagal */
    }
  }

  // ── Derived data ───────────────────────────────────────────
  const jadwalList = useMemo((): JadwalItem[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return patient.riwayatKunjungan
      .filter((k) => k.jadwalKontrol)
      .map((k) => ({ ...k.jadwalKontrol!, fromKunjungan: k.noKunjungan }))
      .sort((a, b) => {
        const da = parseIndoDate(a.tanggal);
        const db = parseIndoDate(b.tanggal);
        const aUp = da >= today;
        const bUp = db >= today;
        if (aUp !== bUp) return aUp ? -1 : 1;
        return aUp ? da.getTime() - db.getTime() : db.getTime() - da.getTime();
      });
  }, [patient.riwayatKunjungan]);

  const upcomingCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return jadwalList.filter(
      (j) => j.status === "Dijadwalkan" && parseIndoDate(j.tanggal) >= today,
    ).length;
  }, [jadwalList]);

  // SPRI yang sedang diadmisi (deep-link ?spri=) → DPJP yang ditetapkan SPRI dipakai untuk
  // peringatan bila operator memilih DPJP berbeda di modal.
  const ranapSpri = useMemo(
    () => (ranapSpriId ? Object.values(spriByKunjungan).find((s) => s.id === ranapSpriId) : undefined),
    [ranapSpriId, spriByKunjungan],
  );

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setPhotoPreview(URL.createObjectURL(f));
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      {/* ── Header: breadcrumb + tab bar ── */}
      <header className="shrink-0 bg-white shadow-xs">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-1.5 text-xs text-slate-400">
          <Link href="/ehis-registration" className="transition hover:text-slate-600">
            Beranda
          </Link>
          <ChevronRight size={10} className="shrink-0" />
          <span className="font-medium text-slate-600">Pasien</span>
          <Link
            href="/ehis-registration"
            className="ml-auto flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
          >
            <X size={12} />
          </Link>
        </div>

        {/* Tab bar */}
        <div className="relative flex items-end border-b border-slate-200 bg-slate-50/60 px-3 pt-2">
          {tabs.map((tab) => {
            const isActive = tab.id === activeId;
            const tabInitials = tab.name
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join("")
              .toUpperCase();
            const hasActive = tab.riwayatKunjungan.some((k) => k.status === "Aktif");
            return (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={cn(
                  "group relative flex shrink-0 cursor-pointer items-center gap-2 rounded-t-lg border px-3 py-2 text-left transition",
                  isActive
                    ? "z-10 border-b-white border-slate-200 bg-white text-slate-800 shadow-xs"
                    : "border-transparent bg-transparent text-slate-500 hover:bg-white/70 hover:text-slate-700",
                )}
                style={isActive ? { marginBottom: -1 } : undefined}
              >
                <div
                  className={cn(
                    "h-3.5 w-1 shrink-0 rounded-full",
                    tab.gender === "L" ? "bg-sky-400" : "bg-pink-400",
                  )}
                />
                <div
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-black",
                    tab.gender === "L" ? "bg-sky-100 text-sky-700" : "bg-pink-100 text-pink-700",
                  )}
                >
                  {tabInitials}
                </div>
                <div className="min-w-0">
                  <p className="max-w-27.5 truncate text-[11px] font-semibold leading-tight">
                    {tab.name.split(" ").slice(0, 2).join(" ")}
                  </p>
                  <p className="font-mono text-[9px] leading-tight opacity-50">{tab.noRM}</p>
                </div>
                {hasActive && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />}
                {tabs.length > 1 && (
                  <span
                    role="button"
                    onClick={(e) => closeTab(tab.id, e)}
                    className="ml-0.5 flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full opacity-0 transition hover:bg-slate-200 group-hover:opacity-100"
                  >
                    <X size={9} />
                  </span>
                )}
              </button>
            );
          })}

          {/* Search / add tab button */}
          <div className="relative mb-0.5 ml-1 pb-1.5">
            <button
              onClick={() => { setShowSearch((v) => !v); setSearchQuery(""); }}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition",
                showSearch
                  ? "border-teal-300 bg-teal-50 text-teal-700"
                  : "border-dashed border-slate-300 bg-white text-slate-400 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600",
              )}
            >
              <Plus size={11} />
              <span>Tambah Pasien</span>
            </button>

            {showSearch && (
              <div className="absolute left-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
                  <Search size={13} className="shrink-0 text-slate-400" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nama, No. RM, atau NIK…"
                    className="flex-1 bg-transparent text-xs text-slate-700 placeholder-slate-300 outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="cursor-pointer text-slate-300 hover:text-slate-500"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <p className="py-5 text-center text-xs text-slate-400">Tidak ada hasil.</p>
                  ) : (
                    <>
                      {!searchQuery && (
                        <p className="px-4 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Semua Pasien
                        </p>
                      )}
                      {searchResults.map((p) => {
                        const pInitials = p.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
                        const isOpen = tabs.some((t) => t.id === p.id);
                        return (
                          <button
                            key={p.id}
                            onClick={() => openPatient(p)}
                            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50"
                          >
                            <div
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black",
                                p.gender === "L" ? "bg-sky-100 text-sky-700" : "bg-pink-100 text-pink-700",
                              )}
                            >
                              {pInitials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
                              <p className="font-mono text-[10px] text-slate-400">{p.noRM} · {p.age} thn</p>
                            </div>
                            {isOpen ? (
                              <span className="shrink-0 rounded-full bg-teal-100 px-1.5 py-0.5 text-[9px] font-bold text-teal-600">
                                Terbuka
                              </span>
                            ) : (
                              <Plus size={11} className="shrink-0 text-slate-300" />
                            )}
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 border-b border-slate-200" style={{ marginBottom: -1 }} />
        </div>
      </header>

      {showSearch && (
        <div className="fixed inset-0 z-40" onClick={() => setShowSearch(false)} />
      )}

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-5 p-4 sm:p-6">
          <PatientHero
            patient={patientView}
            upcomingCount={upcomingCount}
            photoPreview={photoPreview}
            photoRef={photoRef}
            onDaftarKunjungan={() => setDaftarKunjungan(true)}
          />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <PatientLeftPanel
                patient={patientView}
                photoRef={photoRef}
                onInfoLengkap={() => setInfoLengkap(true)}
              />
            </div>
            <div className="lg:col-span-3">
              <PatientRightPanel
                patient={patientView}
                jadwalList={jadwalList}
                upcomingCount={upcomingCount}
                onLihatRiwayat={() => setRiwayat(true)}
                onTambahJadwal={() => setShowTambahJadwal(true)}
                spriByKunjungan={spriByKunjungan}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {showEditData && (
        <EditDataModal patient={patient} onClose={() => setEditData(false)} onSave={setPatient} />
      )}
      {showEditKontak && (
        <EditKontakModal patient={patient} onClose={() => setEditKontak(false)} onSave={setPatient} />
      )}
      {showInfoLengkap && (
        <InfoDetailModal
          patient={patient}
          onClose={() => setInfoLengkap(false)}
          onEditData={() => setEditData(true)}
          onEditKontak={() => setEditKontak(true)}
        />
      )}
      {showRiwayat && (
        <RiwayatKunjunganModal kunjungan={patientView.riwayatKunjungan} onClose={() => setRiwayat(false)} />
      )}
      {showDaftarKunjungan && (
        <DaftarKunjunganModal
          patient={patient}
          kodebooking={antreanKode}
          initial={ranapMode ? { unit: "Rawat Inap", asalMasuk: "Dari IGD" } : undefined}
          spriDpjp={ranapMode && ranapSpri ? { nama: ranapSpri.dpjpNama, smf: ranapSpri.smfSpesialistik } : undefined}
          onClose={() => {
            setDaftarKunjungan(false); setAntreanKode(undefined);
            setRanapMode(false); setRanapSpriId(undefined);
          }}
          onRegistered={ranapMode ? handleRanapRegistered : () => refreshPatientData(patient.id)}
        />
      )}
      {showTambahJadwal && (
        <TambahJadwalModal patient={patient} onClose={() => setShowTambahJadwal(false)} />
      )}

      <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
    </div>
  );
}
