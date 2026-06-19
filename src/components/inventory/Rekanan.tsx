"use client";

import { useEffect, useMemo, useState } from "react";
import { Handshake, Phone, Mail, MapPin, Clock, BadgeCheck, Building2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import {
  InvShell, KpiCard, SectionCard, StatusPill, SearchInput, FilterChip,
  PrimaryButton, EmptyState, SlideOver, useSkeletonDelay, INV_ACCENT,
  tableWrap, tableCls, thCls, tdCls, trCls,
} from "./inventoryShared";
import { type Vendor, type VendorJenis } from "@/lib/inventory/inventoryMock";
import { fetchAllVendors, createVendor } from "@/lib/api/inventory/vendor";
import { ApiError } from "@/lib/api/client";

export default function Rekanan() {
  const loaded = useSkeletonDelay();
  const [list, setList] = useState<Vendor[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [jenis, setJenis] = useState<VendorJenis | "all">("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const data = await fetchAllVendors(ac.signal);
        if (!ac.signal.aborted) setList(data);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat rekanan", e instanceof ApiError ? e.message : undefined);
      } finally {
        if (!ac.signal.aborted) setListLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list
      .filter((v) => jenis === "all" || v.jenis === jenis)
      .filter((v) => !q || v.nama.toLowerCase().includes(q) || v.kode.toLowerCase().includes(q) || v.kontakNama.toLowerCase().includes(q))
      .sort((a, z) => a.nama.localeCompare(z.nama));
  }, [list, jenis, search]);

  const stats = useMemo(() => ({
    total: list.length,
    aktif: list.filter((v) => v.status === "Aktif").length,
    pbf: list.filter((v) => v.jenis === "PBF").length,
  }), [list]);

  const open = openId ? list.find((v) => v.id === openId) ?? null : null;

  return (
    <InvShell
      icon={Handshake}
      title="Rekanan"
      description="Master vendor / distributor / PBF — kontak, izin PBF, dan lead time pengadaan."
      loaded={loaded}
      actions={<PrimaryButton onClick={() => setAddOpen(true)}>Tambah Rekanan</PrimaryButton>}
    >
      <div className="grid shrink-0 grid-cols-3 gap-3">
        <KpiCard icon={Building2} label="Total Rekanan" value={stats.total} tone="cyan" />
        <KpiCard icon={BadgeCheck} label="Aktif" value={stats.aktif} tone="emerald" />
        <KpiCard icon={Handshake} label="PBF" value={stats.pbf} tone="sky" />
      </div>

      <SectionCard className="min-h-0 flex-1" bodyClassName="flex min-h-0 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Cari nama, kode, kontak…" className="min-w-50 flex-1" />
          <div className="flex gap-1.5">
            {(["all", "PBF", "Distributor", "Manufaktur"] as const).map((j) => (
              <FilterChip key={j} label={j === "all" ? "Semua" : j} active={jenis === j} onClick={() => setJenis(j)} />
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {listLoading ? (
            <div className="flex h-full items-center justify-center gap-2 text-slate-400">
              <Loader2 size={16} className="animate-spin text-cyan-500" />
              <span className="text-[13px]">Memuat rekanan…</span>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Handshake} title="Tidak ada rekanan" />
          ) : (
            <div className={tableWrap}>
              <table className={tableCls}>
                <thead><tr>
                  <th className={thCls}>Rekanan</th><th className={thCls}>Jenis</th><th className={thCls}>Kontak</th>
                  <th className={cn(thCls, "text-center")}>Lead Time</th><th className={cn(thCls, "text-center")}>Status</th>
                </tr></thead>
                <tbody>
                  {filtered.map((v) => (
                    <tr key={v.id} className={cn(trCls, "cursor-pointer")} onClick={() => setOpenId(v.id)}>
                      <td className={tdCls}>
                        <p className="font-semibold text-slate-800">{v.nama}</p>
                        <p className="text-[11px] text-slate-400">{v.kode}{v.izinPbf ? ` · ${v.izinPbf}` : ""}</p>
                      </td>
                      <td className={cn(tdCls, "text-slate-500")}>{v.jenis}</td>
                      <td className={cn(tdCls, "text-slate-500")}>
                        <p className="text-[12px]">{v.kontakNama}</p>
                        <p className="text-[11px] text-slate-400">{v.telp}</p>
                      </td>
                      <td className={cn(tdCls, "text-center tabular-nums text-slate-600")}>{v.leadTimeHari} hr</td>
                      <td className={cn(tdCls, "text-center")}>
                        {v.status === "Aktif"
                          ? <StatusPill label="Aktif" bg="bg-emerald-50" text="text-emerald-700" dot="bg-emerald-500" />
                          : <StatusPill label="Non-Aktif" bg="bg-slate-100" text="text-slate-500" dot="bg-slate-400" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Detail */}
      <SlideOver open={!!open} onClose={() => setOpenId(null)} title={open?.nama ?? ""} subtitle={open ? `${open.kode} · ${open.jenis}` : ""}>
        {open && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Jenis" value={open.jenis} />
              <Field label="Izin PBF" value={open.izinPbf ?? "—"} />
              <Field label="Lead Time" value={`${open.leadTimeHari} hari`} />
              <Field label="Status" value={open.status === "Aktif" ? "Aktif" : "Non-Aktif"} />
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <InfoRow icon={Building2} label="Kontak" value={open.kontakNama} />
              <InfoRow icon={Phone} label="Telepon" value={open.telp} />
              <InfoRow icon={Mail} label="Email" value={open.email ?? "—"} />
              <InfoRow icon={MapPin} label="Alamat" value={open.alamat} />
              <InfoRow icon={Clock} label="Lead Time" value={`${open.leadTimeHari} hari kerja`} last />
            </div>
          </div>
        )}
      </SlideOver>

      {/* Add */}
      <AddVendorDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(v) => {
          setList((prev) => [v, ...prev]);
          toast.success("Rekanan ditambahkan", `${v.kode} · ${v.nama}`);
          setAddOpen(false);
        }}
      />
    </InvShell>
  );
}

function AddVendorDrawer({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (v: Vendor) => void }) {
  const [nama, setNama] = useState("");
  const [jenis, setJenis] = useState<VendorJenis>("PBF");
  const [kontak, setKontak] = useState("");
  const [telp, setTelp] = useState("");
  const [alamat, setAlamat] = useState("");
  const [lead, setLead] = useState(3);
  const [saving, setSaving] = useState(false);
  const valid = !!(nama.trim() && kontak.trim() && telp.trim());

  async function submit() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const v = await createVendor({
        nama: nama.trim(), jenis, kontakNama: kontak.trim(), telp: telp.trim(),
        alamat: alamat.trim(), leadTimeHari: lead || 3,
      });
      setNama(""); setKontak(""); setTelp(""); setAlamat(""); setLead(3); setJenis("PBF");
      onCreated(v);
    } catch (e) {
      toast.error("Gagal menyimpan rekanan", e instanceof ApiError ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SlideOver
      open={open} onClose={onClose} title="Tambah Rekanan" subtitle="Vendor / Distributor / PBF baru"
      footer={
        <button type="button" disabled={!valid || saving} onClick={submit}
          className={cn("inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition", valid && !saving ? cn(INV_ACCENT.bgSolid, INV_ACCENT.bgSolidHover) : "cursor-not-allowed bg-slate-300")}>
          {saving && <Loader2 size={13} className="animate-spin" />} {saving ? "Menyimpan…" : "Simpan Rekanan"}
        </button>
      }
    >
      <div className="flex flex-col gap-3">
        <TextField label="Nama Rekanan *" value={nama} onChange={setNama} placeholder="PT …" />
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Jenis</p>
          <div className="flex gap-1.5">
            {(["PBF", "Distributor", "Manufaktur"] as VendorJenis[]).map((j) => (
              <FilterChip key={j} label={j} active={jenis === j} onClick={() => setJenis(j)} />
            ))}
          </div>
        </div>
        <TextField label="Nama Kontak *" value={kontak} onChange={setKontak} placeholder="Nama PIC" />
        <TextField label="Telepon *" value={telp} onChange={setTelp} placeholder="021-…" />
        <TextField label="Alamat" value={alamat} onChange={setAlamat} placeholder="Alamat lengkap" />
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Lead Time (hari)</span>
          <input type="number" min={1} value={lead || ""} onChange={(e) => setLead(Number(e.target.value) || 0)}
            className={cn("w-28 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] font-mono tabular-nums text-slate-800 outline-none transition", INV_ACCENT.focus)} />
        </label>
      </div>
    </SlideOver>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-[13px] font-semibold text-slate-800">{value}</p>
    </div>
  );
}
function InfoRow({ icon: Icon, label, value, last }: { icon: typeof Phone; label: string; value: string; last?: boolean }) {
  return (
    <div className={cn("flex items-start gap-3 px-3 py-2.5", !last && "border-b border-slate-100")}>
      <Icon size={15} className="mt-0.5 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-[13px] text-slate-700">{value}</p>
      </div>
    </div>
  );
}
function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={cn("w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] text-slate-800 outline-none transition", INV_ACCENT.focus)} />
    </label>
  );
}
