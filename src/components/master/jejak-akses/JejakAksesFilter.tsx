"use client";

// Form pencarian Jejak Akses: mode (per pasien / per pegawai) · No. RM atau pencarian pegawai ·
// rentang tanggal (WIB). Form native: Enter mengirim; label terlihat untuk setiap isian.

import { useEffect, useId, useState } from "react";
import { Search, UserRound } from "lucide-react";
import { cn } from "@/lib/ui/utils";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/shared/inputs";
import { searchPegawaiJejak, type AksesPegawaiOptionDTO } from "@/lib/api/audit/aksesRekamMedis";

export type JejakMode = "pasien" | "pegawai";

export interface JejakFilterValue {
  mode: JejakMode;
  noRm: string;
  pegawai: AksesPegawaiOptionDTO | null;
  dari: string;
  sampai: string;
}

const LABEL = "m-xs mb-1 block font-medium text-slate-700";
const INPUT =
  "m-sm h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-slate-900 placeholder:text-slate-400 focus-visible:border-teal-600 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-teal-600/40";

function PegawaiSearch({
  value,
  onChange,
}: {
  value: AksesPegawaiOptionDTO | null;
  onChange: (p: AksesPegawaiOptionDTO | null) => void;
}) {
  const id = useId();
  const [q, setQ] = useState("");
  const [hasil, setHasil] = useState<AksesPegawaiOptionDTO[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  // Cari setelah jeda mengetik (300 ms); request lama dibatalkan.
  useEffect(() => {
    const term = q.trim();
    if (value || term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setStatus("loading");
      searchPegawaiJejak(term, ctrl.signal)
        .then((rows) => {
          setHasil(rows);
          setStatus("done");
        })
        .catch((e: unknown) => {
          if ((e as Error).name !== "AbortError") setStatus("error");
        });
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, value]);

  if (value) {
    return (
      <div>
        <span className={LABEL}>Pegawai</span>
        <div className="flex h-9 items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3">
          <UserRound className="size-4 shrink-0 text-teal-700" aria-hidden="true" />
          <span className="m-sm min-w-0 flex-1 truncate font-medium text-teal-900">
            {value.nama}
            {value.nip && <span className="font-normal text-teal-800"> · NIP {value.nip}</span>}
          </span>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setQ("");
              setHasil([]);
              setStatus("idle");
            }}
            className="m-xs rounded px-1.5 py-0.5 font-medium text-teal-800 hover:bg-teal-100 focus-visible:outline-2 focus-visible:outline-teal-700"
          >
            Ganti
          </button>
        </div>
      </div>
    );
  }

  const term = q.trim();
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        Pegawai
      </label>
      <input
        id={id}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Ketik nama atau NIP (min. 2 huruf)"
        autoComplete="off"
        className={INPUT}
      />
      <div aria-live="polite" className="mt-1">
        {term.length >= 2 && status === "loading" && <p className="m-xs text-slate-500">Mencari…</p>}
        {status === "error" && <p className="m-xs text-rose-700">Pencarian pegawai gagal. Coba lagi.</p>}
        {term.length >= 2 && status === "done" && hasil.length === 0 && (
          <p className="m-xs text-slate-500">Tidak ada pegawai yang cocok.</p>
        )}
      </div>
      {term.length >= 2 && hasil.length > 0 && (
        <ul role="list" className="mt-1 max-h-56 overflow-auto rounded-md border border-slate-200 bg-white p-1 shadow-sm">
          {hasil.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onChange(p)}
                className="m-sm flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-slate-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-700"
              >
                <span className="min-w-0 flex-1 truncate text-slate-800">{p.nama}</span>
                {p.nip && <span className="m-xs shrink-0 font-mono text-slate-500">{p.nip}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function JejakAksesFilter({
  value,
  onChange,
  onSubmit,
  busy,
}: {
  value: JejakFilterValue;
  onChange: (next: JejakFilterValue) => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  const rmId = useId();
  const dariId = useId();
  const sampaiId = useId();
  const set = <K extends keyof JejakFilterValue>(k: K, v: JejakFilterValue[K]) => onChange({ ...value, [k]: v });
  const siap = value.mode === "pasien" ? value.noRm.trim().length > 0 : value.pegawai !== null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (siap && !busy) onSubmit();
      }}
      className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[auto_minmax(14rem,1fr)_10rem_10rem]">
        <fieldset className="sm:col-span-2 xl:col-span-1">
          <legend className={LABEL}>Cari berdasarkan</legend>
          <div className="inline-flex rounded-md bg-slate-100 p-0.5">
            {(["pasien", "pegawai"] as const).map((m) => (
              <label key={m} className="relative">
                <input
                  type="radio"
                  name="jejak-mode"
                  value={m}
                  checked={value.mode === m}
                  onChange={() => set("mode", m)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "m-sm inline-flex h-8 cursor-pointer items-center rounded px-3 font-medium text-slate-600 transition-colors",
                    "hover:text-slate-900 peer-checked:bg-white peer-checked:text-teal-800 peer-checked:shadow-sm",
                    "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-teal-700",
                  )}
                >
                  {m === "pasien" ? "Pasien" : "Pegawai"}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {value.mode === "pasien" ? (
          <div>
            <label htmlFor={rmId} className={LABEL}>
              No. Rekam Medis
            </label>
            <input
              id={rmId}
              value={value.noRm}
              onChange={(e) => set("noRm", e.target.value)}
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              placeholder="mis. 26110001"
              className={cn(INPUT, "font-mono")}
            />
          </div>
        ) : (
          <PegawaiSearch value={value.pegawai} onChange={(p) => set("pegawai", p)} />
        )}

        <div>
          <label htmlFor={dariId} className={LABEL}>
            Dari
          </label>
          <DatePicker id={dariId} value={value.dari} onChange={(v) => set("dari", v)} placeholder="Awal" />
        </div>
        <div>
          <label htmlFor={sampaiId} className={LABEL}>
            Sampai
          </label>
          <DatePicker id={sampaiId} value={value.sampai} onChange={(v) => set("sampai", v)} placeholder="Akhir" />
        </div>
      </div>

      <Button type="submit" disabled={!siap || busy} className="h-9">
        <Search aria-hidden="true" />
        {busy ? "Memuat…" : "Tampilkan"}
      </Button>
      {!siap && (
        <p className="m-xs -mt-2 text-slate-500 lg:col-span-2">
          {value.mode === "pasien" ? "Isi No. RM untuk mulai mencari." : "Pilih pegawai untuk mulai mencari."}
        </p>
      )}
    </form>
  );
}
