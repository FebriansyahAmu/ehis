"use client";

// WilayahCascade — pemilih wilayah bertingkat (Provinsi → Kab/Kota → Kecamatan → Desa/Kel)
// yang FETCH LANGSUNG dari master.Wilayah (Kemendagri) lazy per-level via /api/v1/wilayah.
// Reusable: alamat RS · alamat pasien · lokasiLaka KLL. Pakai global Select (bukan native).
//
// value = 4 nama + kodeWilayah (dotted leaf kode Kemendagri, PK). onChange kirim patch.
// Mount: rekonstruksi rantai dari kodeWilayah (?ancestorsOf) → pre-select semua level.
// Data lama tanpa kode dotted → banner "pilih ulang" (nama tetap tampil).

import { useEffect, useRef, useState } from "react";
import { MapPin, Building, Map, Landmark, Home, Loader2, Info } from "lucide-react";
import { Select } from "./Select";
import { listWilayah, type WilayahDTO } from "@/lib/api/wilayah";

export interface WilayahValue {
  provinsi:    string;
  kota:        string;
  kecamatan:   string;
  kelurahan:   string;
  kodeWilayah: string; // dotted leaf kode
}

interface Props {
  value:    WilayahValue;
  onChange: (patch: Partial<WilayahValue>) => void;
}

const toOpts = (rows: WilayahDTO[]) => rows.map((w) => ({ value: w.kode, label: w.nama }));

const LEVELS = [
  { key: "prov", label: "Provinsi",         icon: MapPin,   ph: "Pilih provinsi…",        dep: "" },
  { key: "kota", label: "Kota / Kabupaten", icon: Building, ph: "Pilih kota/kabupaten…",  dep: "Provinsi" },
  { key: "kec",  label: "Kecamatan",        icon: Map,      ph: "Pilih kecamatan…",       dep: "Kota/Kabupaten" },
  { key: "kel",  label: "Desa / Kelurahan", icon: Home,     ph: "Pilih desa/kelurahan…",  dep: "Kecamatan" },
] as const;

function FieldLabel({ label, icon: Icon }: { label: string; icon: IconComponent }) {
  return (
    <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      <Icon size={12} className="text-slate-400" /> {label}
    </span>
  );
}

export function WilayahCascade({ value, onChange }: Props) {
  const [provOpts, setProvOpts] = useState<WilayahDTO[]>([]);
  const [kotaOpts, setKotaOpts] = useState<WilayahDTO[]>([]);
  const [kecOpts,  setKecOpts]  = useState<WilayahDTO[]>([]);
  const [kelOpts,  setKelOpts]  = useState<WilayahDTO[]>([]);
  const [sel, setSel] = useState({ prov: "", kota: "", kec: "", kel: "" });
  const [busy, setBusy] = useState({ prov: true, kota: false, kec: false, kel: false });
  const [legacy, setLegacy] = useState(false);
  const alive = useRef(true);

  // Muat provinsi + rekonstruksi rantai (sekali).
  useEffect(() => {
    alive.current = true;
    (async () => {
      try {
        const prov = await listWilayah({ level: 1, limit: 100 });
        if (alive.current) setProvOpts(prov);
      } finally {
        if (alive.current) setBusy((b) => ({ ...b, prov: false }));
      }

      const kode = value.kodeWilayah?.trim() ?? "";
      if (kode.includes(".")) {
        try {
          const chain = await listWilayah({ ancestorsOf: kode });
          if (!alive.current) return;
          const p = chain.find((w) => w.level === 1);
          const k = chain.find((w) => w.level === 2);
          const c = chain.find((w) => w.level === 3);
          const d = chain.find((w) => w.level === 4);
          if (!p) { setLegacy(true); return; }
          setSel({ prov: p.kode, kota: k?.kode ?? "", kec: c?.kode ?? "", kel: d?.kode ?? "" });
          const [k2, k3, k4] = await Promise.all([
            listWilayah({ parentKode: p.kode, limit: 1000 }),
            k ? listWilayah({ parentKode: k.kode, limit: 1000 }) : Promise.resolve<WilayahDTO[]>([]),
            c ? listWilayah({ parentKode: c.kode, limit: 1000 }) : Promise.resolve<WilayahDTO[]>([]),
          ]);
          if (!alive.current) return;
          setKotaOpts(k2); setKecOpts(k3); setKelOpts(k4);
        } catch {
          if (alive.current) setLegacy(true);
        }
      } else if (value.provinsi || value.kota || value.kecamatan || value.kelurahan) {
        setLegacy(true); // data lama (nama saja, tanpa kode dotted)
      }
    })();
    return () => { alive.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadChildren(
    parentKode: string,
    set: (r: WilayahDTO[]) => void,
    flag: "kota" | "kec" | "kel",
  ) {
    setBusy((b) => ({ ...b, [flag]: true }));
    try {
      const rows = await listWilayah({ parentKode, limit: 1000 });
      if (alive.current) set(rows);
    } finally {
      if (alive.current) setBusy((b) => ({ ...b, [flag]: false }));
    }
  }

  function pickProv(kode: string) {
    const w = provOpts.find((o) => o.kode === kode);
    if (!w) return;
    setLegacy(false);
    setSel({ prov: kode, kota: "", kec: "", kel: "" });
    setKotaOpts([]); setKecOpts([]); setKelOpts([]);
    onChange({ provinsi: w.nama, kota: "", kecamatan: "", kelurahan: "", kodeWilayah: w.kode });
    void loadChildren(kode, setKotaOpts, "kota");
  }
  function pickKota(kode: string) {
    const w = kotaOpts.find((o) => o.kode === kode);
    if (!w) return;
    setSel((s) => ({ ...s, kota: kode, kec: "", kel: "" }));
    setKecOpts([]); setKelOpts([]);
    onChange({ kota: w.nama, kecamatan: "", kelurahan: "", kodeWilayah: w.kode });
    void loadChildren(kode, setKecOpts, "kec");
  }
  function pickKec(kode: string) {
    const w = kecOpts.find((o) => o.kode === kode);
    if (!w) return;
    setSel((s) => ({ ...s, kec: kode, kel: "" }));
    setKelOpts([]);
    onChange({ kecamatan: w.nama, kelurahan: "", kodeWilayah: w.kode });
    void loadChildren(kode, setKelOpts, "kel");
  }
  function pickKel(kode: string) {
    const w = kelOpts.find((o) => o.kode === kode);
    if (!w) return;
    setSel((s) => ({ ...s, kel: kode }));
    onChange({ kelurahan: w.nama, kodeWilayah: w.kode });
  }

  const cfg = {
    prov: { opts: provOpts, val: sel.prov, pick: pickProv, disabled: false,      loading: busy.prov },
    kota: { opts: kotaOpts, val: sel.kota, pick: pickKota, disabled: !sel.prov,  loading: busy.kota },
    kec:  { opts: kecOpts,  val: sel.kec,  pick: pickKec,  disabled: !sel.kota,  loading: busy.kec  },
    kel:  { opts: kelOpts,  val: sel.kel,  pick: pickKel,  disabled: !sel.kec,   loading: busy.kel  },
  } as const;

  return (
    <div className="space-y-3">
      {legacy && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2">
          <Info size={13} className="mt-0.5 shrink-0 text-amber-500" />
          <p className="text-[11px] leading-relaxed text-amber-700">
            Alamat tersimpan belum tertaut ke master wilayah. Pilih ulang dari{" "}
            <span className="font-semibold">Provinsi</span> untuk memperbarui kode wilayah resmi.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {LEVELS.map((lv) => {
          const c = cfg[lv.key];
          return (
            <label key={lv.key} className="flex flex-col">
              <FieldLabel label={lv.label} icon={lv.icon} />
              {c.disabled ? (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-3 py-2 text-[13px] text-slate-300">
                  <Landmark size={13} className="shrink-0" />
                  <span className="truncate">{`Pilih ${lv.dep} dulu`}</span>
                </div>
              ) : c.loading ? (
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-400">
                  <Loader2 size={13} className="shrink-0 animate-spin text-sky-500" />
                  Memuat…
                </div>
              ) : (
                <Select
                  value={c.val}
                  onChange={c.pick}
                  options={toOpts(c.opts)}
                  icon={lv.icon}
                  placeholder={lv.ph}
                  searchable
                />
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
