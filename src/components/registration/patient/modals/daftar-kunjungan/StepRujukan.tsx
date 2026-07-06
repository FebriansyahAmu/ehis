"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownToLine, Building2, Check, CheckCircle2, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { RujukanMasukPanel } from "@/components/registration/kunjungan/Tabs/rujukan/RujukanMasukPanel";
import { DiagnosaCombobox } from "@/components/registration/kunjungan/Tabs/rujukan/DiagnosaCombobox";
import {
  MOCK_SEP_RANAP, getIcdName, fmtDate,
  type BpjsRujukanItem, type IcdOption,
} from "@/components/registration/kunjungan/Tabs/rujukan/rujukanTypes";
import { listKunjungan, getDiagnosaUtama, type KunjunganListItemDTO } from "@/lib/api/kunjungan";
import type { RujukanPick } from "./config";

type Mode = "masuk" | "kontrol";

const MODE_TABS: { id: Mode; label: string; icon: typeof ArrowDownToLine; desc: string }[] = [
  { id: "masuk", label: "Rujukan Masuk", icon: ArrowDownToLine, desc: "Cari rujukan FKTP via no. BPJS" },
  { id: "kontrol", label: "Kontrol Pasca Ranap", icon: Building2, desc: "Pakai No. SEP rawat inap terakhir" },
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function StepRujukan({
  patientId, noBpjs, rujukan, setRujukan,
}: {
  patientId: string;
  noBpjs: string;
  rujukan: RujukanPick;
  setRujukan: React.Dispatch<React.SetStateAction<RujukanPick>>;
}) {
  const [mode, setMode] = useState<Mode>(rujukan.source);

  function changeMode(m: Mode) {
    setMode(m);
    setRujukan({ source: m, noRujukan: "", diagnosa: null });
  }

  function pickMasuk(r: BpjsRujukanItem) {
    setRujukan({
      source: "masuk",
      noRujukan: r.norujukan,
      diagnosa: { code: r.diagppk, name: getIcdName(r.diagppk) },
    });
  }

  const picked = rujukan.noRujukan.length > 0 && rujukan.source === mode;

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {MODE_TABS.map((t) => {
          const isActive = mode === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => changeMode(t.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition-all duration-150",
                isActive ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700",
              )}
            >
              <t.icon size={12} className={isActive ? "text-sky-500" : "text-slate-400"} />
              {t.label}
            </button>
          );
        })}
      </div>
      <p className="-mt-2 px-1 text-[10px] text-slate-400">{MODE_TABS.find((t) => t.id === mode)?.desc}</p>

      {/* Selected summary — data inti: no. rujukan + diagnosa */}
      <AnimatePresence>
        {picked && rujukan.diagnosa && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
              <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-1">
                <div>
                  <p className="text-[8.5px] font-bold uppercase tracking-wider text-emerald-600">No. Rujukan</p>
                  <p className="truncate font-mono text-[11px] font-bold text-slate-700">{rujukan.noRujukan}</p>
                </div>
                <div>
                  <p className="text-[8.5px] font-bold uppercase tracking-wider text-emerald-600">Diagnosa</p>
                  <p className="truncate text-[11px] font-semibold text-slate-700">
                    {rujukan.diagnosa.code} — {rujukan.diagnosa.name}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          {mode === "masuk" ? (
            <RujukanMasukPanel noBpjs={noBpjs} onPick={pickMasuk} />
          ) : (
            <KontrolPicker patientId={patientId} rujukan={rujukan} setRujukan={setRujukan} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Kontrol pasca ranap — SEP + diagnosa dari kunjungan Rawat Inap terakhir pasien ─────────
// Untuk pasien JKN kontrol pasca ranap: No. SEP rawat inap terakhir dipakai sebagai No. Rujukan,
// diagnosa masuk dari episode ranap tsb di-prefill. Sumber = worklist kunjungan pasien (lintas
// unit, pola PatientDashboard) → tanpa endpoint baru. Pasien demo (non-UUID) pakai contoh mock.

interface LastRanap {
  id: string; // kunjungan RI — untuk tarik diagnosa UTAMA (primer) episode ranap
  noSEP: string;
  tglKeluarLabel: string;
  kelasLabel: string;
}

const fmtKelas = (k: string | null): string => (k ? k.replace(/_/g, " ") : "—");

// Demo (pasien non-UUID): contoh MOCK_SEP_RANAP agar alur tetap bisa dicoba tanpa data DB.
const MOCK_LAST: LastRanap = {
  id: "demo",
  noSEP: MOCK_SEP_RANAP.noSEP,
  tglKeluarLabel: MOCK_SEP_RANAP.tglKeluar,
  kelasLabel: MOCK_SEP_RANAP.kelas,
};
const MOCK_DX: IcdOption = { code: MOCK_SEP_RANAP.diagnosa, name: getIcdName(MOCK_SEP_RANAP.diagnosa) };

/** Kunjungan Rawat Inap terakhir yang punya SEP (discharge/terbaru dulu). */
function pickLastRanap(items: KunjunganListItemDTO[]): LastRanap | null {
  const k = items
    .filter((it) => it.unit === "RawatInap" && it.sep?.noSep)
    .sort((a, b) => {
      const ta = new Date(a.selesaiAt ?? a.waktuKunjungan).getTime();
      const tb = new Date(b.selesaiAt ?? b.waktuKunjungan).getTime();
      return tb - ta;
    })[0];
  if (!k) return null;
  return {
    id: k.id,
    noSEP: k.sep!.noSep!,
    tglKeluarLabel: k.selesaiAt ? fmtDate(k.selesaiAt) : "—",
    kelasLabel: fmtKelas(k.kelas),
  };
}

function KontrolPicker({
  patientId, rujukan, setRujukan,
}: {
  patientId: string;
  rujukan: RujukanPick;
  setRujukan: React.Dispatch<React.SetStateAction<RujukanPick>>;
}) {
  const demo = !UUID_RE.test(patientId);

  const [loading, setLoading] = useState(!demo);
  const [last, setLast] = useState<LastRanap | null>(demo ? MOCK_LAST : null);
  const [ranapDx, setRanapDx] = useState<IcdOption | null>(demo ? MOCK_DX : null);
  const [manual, setManual] = useState(false);
  const [noSEP, setNoSEP] = useState("");
  const [diagnosa, setDiagnosa] = useState<IcdOption | null>(demo ? MOCK_DX : null);
  const prefilled = useRef(demo); // demo sudah ter-prefill dari mock

  // Tarik SEP + diagnosa UTAMA (primer) dari kunjungan Rawat Inap terakhir pasien (JKN kontrol
  // pasca ranap). `loading` awal = !demo; semua setState di callback async (hindari
  // set-state-in-effect). Operator tetap bisa mengganti manual via master ICD di bawah.
  useEffect(() => {
    if (demo) return;
    const ac = new AbortController();
    (async () => {
      try {
        const { items } = await listKunjungan({ patientId, limit: 50 }, ac.signal);
        const found = pickLastRanap(items);
        setLast(found);
        if (found) {
          const dx = await getDiagnosaUtama(found.id, ac.signal).catch(() => null);
          if (dx?.kode) {
            const opt: IcdOption = { code: dx.kode, name: dx.nama ?? dx.kode };
            setRanapDx(opt);
            if (!prefilled.current) { setDiagnosa(opt); prefilled.current = true; }
          }
        }
      } catch {
        /* biarkan kosong → input manual */
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [patientId, demo]);

  const effectiveSEP = manual ? noSEP.trim() : (last?.noSEP ?? "");
  const ready = effectiveSEP.length >= 10 && diagnosa !== null;
  const committed = rujukan.source === "kontrol" && rujukan.noRujukan.length > 0;
  const showManual = manual || (!loading && !last);

  function gunakan() {
    if (!ready || !diagnosa) return;
    setRujukan({ source: "kontrol", noRujukan: effectiveSEP, diagnosa });
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* SEP rawat inap terakhir */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          SEP Rawat Inap Terakhir <span className="font-normal normal-case text-slate-300">— jadi No. Rujukan kontrol</span>
        </p>

        {loading ? (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-[11px] text-slate-400">
            <Loader2 size={13} className="animate-spin" /> Menarik SEP rawat inap terakhir…
          </div>
        ) : showManual ? (
          <div className="space-y-1.5">
            {!last && (
              <p className="flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-medium text-amber-700">
                <FileText size={11} className="mt-px shrink-0" />
                Tidak ada SEP rawat inap terakhir untuk pasien ini — masukkan No. SEP manual.
              </p>
            )}
            <input
              type="text"
              value={noSEP}
              onChange={(e) => setNoSEP(e.target.value)}
              placeholder="Masukkan No. SEP rawat inap…"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-[12px] text-slate-800 placeholder:text-slate-300 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
            {last && (
              <button type="button" onClick={() => { setManual(false); setNoSEP(""); }}
                className="text-[9.5px] text-slate-400 underline underline-offset-2 hover:text-slate-600">
                Gunakan SEP terakhir
              </button>
            )}
          </div>
        ) : last ? (
          // Kartu SEP ranap terakhir — aksen hijau (data ditarik dari episode rawat inap).
          <div className="relative overflow-hidden rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/40 p-3 shadow-sm ring-1 ring-emerald-100">
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-200/25 blur-2xl" aria-hidden="true" />
            <div className="relative flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 ring-1 ring-emerald-200">
                  <FileText size={11} className="text-emerald-600" />
                </span>
                <span className="font-mono text-[11px] font-bold text-emerald-800">{last.noSEP}</span>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
                Rawat Inap Terakhir
              </span>
            </div>
            <div className="relative mt-2 grid grid-cols-3 gap-x-3">
              {([
                ["Diagnosa Primer", ranapDx ? `${ranapDx.code} — ${ranapDx.name}` : "—"],
                ["Tgl Keluar", last.tglKeluarLabel],
                ["Kelas", last.kelasLabel],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k}>
                  <p className="text-[8px] font-bold uppercase tracking-wide text-emerald-600/70">{k}</p>
                  <p className="truncate text-[10px] font-medium text-emerald-900">{v}</p>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setManual(true)}
              className="relative mt-2 text-[9.5px] text-emerald-600/80 underline underline-offset-2 hover:text-emerald-700">
              Input No. SEP lain
            </button>
          </div>
        ) : null}
      </div>

      {/* Diagnosa */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Diagnosa <span className="font-normal normal-case text-slate-300">— ICD-10, wajib</span>
        </p>
        <DiagnosaCombobox value={diagnosa} onChange={setDiagnosa} />
      </div>

      {/* Commit */}
      <div className="flex items-center justify-between gap-3 pt-0.5">
        <span className="text-[10px] text-slate-300">
          {!ready ? "Pilih No. SEP & diagnosa" : committed ? "Tersimpan sebagai rujukan" : ""}
        </span>
        <button
          type="button"
          onClick={gunakan}
          disabled={!ready}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-4 py-2 text-[11px] font-bold transition active:scale-95",
            ready ? "bg-emerald-600 text-white hover:bg-emerald-700" : "cursor-not-allowed bg-slate-100 text-slate-400",
          )}
        >
          {committed ? <><Check size={12} /> Digunakan</> : "Gunakan sebagai Rujukan"}
        </button>
      </div>
    </div>
  );
}
