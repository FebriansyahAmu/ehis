"use client";

import { useMemo } from "react";
import { FileText, Eye, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Field, TextInput, TextArea, Select, SectionGroup,
} from "@/components/master/shared";
import {
  type SuratTemplate, type JenisSuratPulang,
  SURAT_JENIS_CFG,
} from "@/lib/master/templateFormMock";

interface Props {
  draft: SuratTemplate;
  onPatch: (patch: Partial<SuratTemplate>) => void;
}

const COMMON_PLACEHOLDERS = [
  "${nama}", "${noRM}", "${tglLahir}", "${jenisKelamin}",
  "${diagnosis}", "${kodeIcd10}", "${tindakan}",
  "${tglMasuk}", "${tglPulang}", "${tglKontrol}", "${tglRujukan}",
  "${dokterDpjp}", "${dokterTujuan}", "${poliTujuan}",
  "${namaRS}", "${ruangan}", "${kelas}",
  "${penjamin}", "${noKartu}", "${fktpTujuan}",
  "${pekerjaan}", "${alamat}", "${lamaIstirahat}",
];

export default function SuratPane({ draft, onPatch }: Props) {
  const placeholdersInBody = useMemo(() => {
    const matches = draft.body.match(/\$\{\w+\}/g);
    return Array.from(new Set(matches ?? []));
  }, [draft.body]);

  const insertPlaceholder = (p: string) => {
    onPatch({ body: draft.body + (draft.body.endsWith(" ") || !draft.body ? "" : " ") + p });
  };

  const cfg = SURAT_JENIS_CFG[draft.jenisSurat];

  return (
    <div className="flex flex-col gap-4">
      {/* Identitas */}
      <SectionGroup
        title="Identitas Template"
        icon={<FileText size={11} />}
        accent={{ bg: "bg-sky-50", text: "text-sky-700" }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Label Template" required>
            <TextInput
              value={draft.label}
              onChange={(v) => onPatch({ label: v })}
              placeholder="mis. Surat Kontrol Standar"
              accent="sky"
              maxW="max-w-md"
            />
          </Field>

          <Field label="Jenis Surat" required>
            <Select
              value={draft.jenisSurat}
              onChange={(v) => onPatch({ jenisSurat: v as JenisSuratPulang })}
              options={Object.entries(SURAT_JENIS_CFG).map(([k, c]) => ({
                value: k as JenisSuratPulang,
                label: c.label,
              }))}
              accent="sky"
              maxW="max-w-xs"
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Deskripsi" hint="Penjelasan singkat fungsi surat ini (opsional)">
              <TextInput
                value={draft.deskripsi ?? ""}
                onChange={(v) => onPatch({ deskripsi: v })}
                placeholder="mis. Surat jadwal kontrol pasca rawat"
                accent="sky"
                maxW="max-w-2xl"
              />
            </Field>
          </div>

          <Field label="Status">
            <Select
              value={draft.status}
              onChange={(v) => onPatch({ status: v as "Aktif" | "NonAktif" })}
              options={[
                { value: "Aktif", label: "Aktif" },
                { value: "NonAktif", label: "Non-Aktif" },
              ]}
              accent="sky"
              maxW="max-w-[180px]"
            />
          </Field>
        </div>
      </SectionGroup>

      {/* Body editor + preview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionGroup
          title="Editor Body Surat"
          desc="Pakai placeholder ${nama}, ${noRM}, ${diagnosis}, dst — akan auto-fill saat surat di-cetak"
          icon={<FileText size={11} />}
          accent={{ bg: "bg-sky-50", text: "text-sky-700" }}
        >
          <Field label="Body Template" required>
            <TextArea
              value={draft.body}
              onChange={(v) => onPatch({ body: v })}
              placeholder="Yang bertanda tangan di bawah ini...

Nama Pasien : ${nama}
No. RM      : ${noRM}
..."
              rows={14}
              monospace
              accent="sky"
            />
          </Field>

          <div>
            <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <Tag size={10} /> Placeholder Tersedia (klik untuk insert)
            </p>
            <div className="flex flex-wrap gap-1">
              {COMMON_PLACEHOLDERS.map((p) => {
                const used = placeholdersInBody.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => insertPlaceholder(p)}
                    className={cn(
                      "rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold transition",
                      used
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700",
                    )}
                    title={used ? "Sudah dipakai" : "Klik untuk tambahkan ke body"}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              <span className="text-emerald-600">●</span> hijau = sudah dipakai di body
            </p>
          </div>
        </SectionGroup>

        <SectionGroup
          title="Preview Surat"
          desc="Tampilan body apa adanya — placeholder belum di-substitute"
          icon={<Eye size={11} />}
          accent={{ bg: "bg-slate-50", text: "text-slate-700" }}
        >
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between border-b border-slate-200 pb-2">
              <span className={cn("rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase", cfg.bg, cfg.text)}>
                {cfg.label}
              </span>
              <span className="text-[9.5px] text-slate-400">
                {placeholdersInBody.length} placeholder
              </span>
            </div>
            {draft.body ? (
              <pre className="whitespace-pre-wrap break-words font-mono text-[10px] leading-relaxed text-slate-700">
                {draft.body}
              </pre>
            ) : (
              <p className="text-center text-[11px] italic text-slate-400">
                (Body kosong — ketik di editor)
              </p>
            )}
          </div>
        </SectionGroup>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2">
        <FileText size={13} className="mt-0.5 shrink-0 text-amber-600" />
        <p className="flex-1 text-[10.5px] leading-relaxed text-amber-800">
          <strong>PMK 269/2008:</strong> Surat keterangan medis adalah bagian dari rekam medis dan harus disimpan minimal 5 tahun. KOP surat akan diambil dari{" "}
          <strong>Profil RS</strong> saat surat dicetak — template ini hanya berisi body content.
        </p>
      </div>
    </div>
  );
}
